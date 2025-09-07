/*
 * Copyright © 2020. Spectrollay
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

rootPath = '/' + (window.location.pathname.split('/').filter(Boolean).length > 0 ? window.location.pathname.split('/').filter(Boolean)[0] : '');
switchValues = JSON.parse(localStorage.getItem(`(${rootPath}/)switch_value`)) || {};

// 焦点事件
// 选择多个元素
// 移除焦点列表
const exclusionSelectors = [
    'button',
    '.overlay',
    'modal_area',
    'modal_content',
    'modal_checkbox_area .custom-checkbox',
    'textarea',
    '.zoom_mask'
];
// 新增焦点列表
const inclusionSelectors = [
    '.clickable_no_link',
    '.header_item:not(.header_item_blank)',
    '#banner_tip',
    '.image_load_error',
    'modal_close_btn',
    '.edition_block',
    'link-block',
    '.btn:not(.disabled_btn)',
    '.tab_bar_btn',
    '.expandable_card',
    '.plan_block',
    '.custom-checkbox:not(.disabled)',
    '.switch:not(.disabled_switch) .switch_slider',
    '.slider_slider:not(.disabled_slider)',
    '.dropdown_label:not(.disabled_dropdown)',
    '.dropdown_option',
    'text-field:not(.disabled_text_field) textarea',
    '.share_img_title',
    '.output_code.selectable',
    '.zoom_close_btn',
    '.zoom_theme_btn'
];

// 生成用于选择元素的选择器字符串
const exclusionSelectorString = exclusionSelectors.join(', ');
const inclusionSelectorString = inclusionSelectors.join(', ');

// 模拟点击当前元素
function handleEnterPress(e) {
    if (e.key === 'Enter') {
        if (e.target && typeof e.target.click === 'function') {
            e.target.click(); // 模拟点击
        }
        e.stopPropagation(); // 阻止事件冒泡
        e.preventDefault();  // 阻止浏览器默认行为
    }
}

// 检查元素是否真实可见且可聚焦
function isElementActuallyFocusable(el) {
    if (!el || typeof el.focus !== 'function' || el.hasAttribute('disabled')) {  // 如果元素不存在或没有focus方法,则不可聚焦
        return false;
    }
    if (el.getAttribute('tabindex') === '-1') { // 检查tabindex是否为-1
        return false;
    }
    try {
        // 检查可见性
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) {
            return false; // 元素不可见
        }
        // 检查元素是否在渲染树中并且有实际占位
        if (el.getClientRects().length === 0) { // 如果长度为0通常意味着元素没有被渲染或没有尺寸
            return false;
        }
    } catch (e) {
        return false;
        // 如果获取样式出错也认为不可聚焦
    }
    return true; // 所有检查通过,元素可聚焦
}

// 设置tabindex属性,并给可聚焦元素添加回车键监听器
function setElementsTabindex(inclusionList, exclusionList) {
    if (exclusionList) {
        exclusionList.forEach(el => {
            if (el) {
                el.setAttribute('tabindex', '-1'); // 禁用焦点
            }
        });
    }

    if (inclusionList) {
        inclusionList.forEach(el => {
            if (el) {
                el.setAttribute('tabindex', '0'); // 允许通过Tab聚焦
                el.removeEventListener('keyup', handleEnterPress); // 防止重复绑定
                el.addEventListener('keyup', handleEnterPress);    // 绑定回车事件
            }
        });
    }
}

// 获取父元素下的所有可聚焦元素,设置tabindex并返回焦点信息
function chooseElementsTabindex(parentElement) {
    if (!parentElement || typeof parentElement.querySelectorAll !== 'function') {
        logManager.log("提供焦点选择的父元素无效!", 'error');
        return {firstTabStop: null, lastTabStop: null, focusableList: []};
    }

    const localExclusionElements = parentElement.querySelectorAll(exclusionSelectorString);
    const localInclusionElements = parentElement.querySelectorAll(inclusionSelectorString);

    setElementsTabindex(localInclusionElements, localExclusionElements); // 设置tabindex

    // 使用过滤器来确定实际可聚焦的元素
    const focusableList = Array.from(localInclusionElements).filter(isElementActuallyFocusable);
    const firstTabStop = focusableList[0] || null;
    const lastTabStop = focusableList[focusableList.length - 1] || null;

    return {firstTabStop, lastTabStop, focusableList};
}

// 全局更新页面上所有元素的tabindex和监听器
function updateFocusableElements() { // NOTE 在有涉及到元素状态变化的地方要调用这个函数
    const globalExclusionElements = document.querySelectorAll(exclusionSelectorString);
    const globalInclusionElements = document.querySelectorAll(inclusionSelectorString);
    setElementsTabindex(globalInclusionElements, globalExclusionElements);
}

// 自定义Tab键导航逻辑,实现焦点陷阱
function handleTabNavigation(e) {
    const trappingElement = e.currentTarget;

    if (!trappingElement || e.key !== 'Tab') return;

    const {focusableList, firstTabStop, lastTabStop} = chooseElementsTabindex(trappingElement);

    if (!focusableList.length) {
        e.preventDefault(); // 阻止默认行为
        return;
    }

    const currentActiveElement = document.activeElement;
    const currentIndex = focusableList.indexOf(currentActiveElement);

    e.preventDefault(); // 阻止默认行为

    let nextFocusElement; // 用于记录将要聚焦的元素

    if (e.shiftKey) {
        // (Shift + Tab) - 向后循环
        if (currentIndex === 0) { // 如果当前在第一个元素
            nextFocusElement = lastTabStop;
        } else if (currentIndex > 0) { // 如果当前在列表中且不是第一个
            nextFocusElement = focusableList[currentIndex - 1];
        } else { // 如果当前焦点不在列表,通常聚焦到最后一个
            nextFocusElement = lastTabStop;
        }
    } else {
        // Tab - 向前循环
        if (currentIndex === focusableList.length - 1) { // 如果当前在最后一个元素
            nextFocusElement = firstTabStop;
        } else if (currentIndex >= 0 && currentIndex < focusableList.length - 1) { // 如果当前在列表中且不是最后一个
            nextFocusElement = focusableList[currentIndex + 1];
        } else { // 如果当前焦点不在列表,通常聚焦到第一个
            nextFocusElement = firstTabStop;
        }
    }

    nextFocusElement.focus();
}

// 弹窗焦点陷阱
const modals = document.querySelectorAll('modal');
modals.forEach((modal) => {
    modal.removeEventListener('keydown', handleTabNavigation); // 移除旧的事件监听器
    modal.addEventListener('keydown', handleTabNavigation); // 添加新的事件监听器
    modal.addEventListener('shown.modal', () => {
        const {firstTabStop: modalFirstTabStop} = chooseElementsTabindex(modal); // 在弹窗显示时重新获取最新的可聚焦列表
        if (modalFirstTabStop) {
            modalFirstTabStop.focus(); // 聚焦弹窗内的第一个可聚焦元素
        } else {
        }
    });
});

window.addEventListener('load', () => {
    updateFocusableElements(); // 初始化元素焦点
});