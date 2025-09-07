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

// 节流函数,防止事件频繁触发
function throttle(func, delay) {
    let lastCall = 0;
    return function (...args) {
        const now = new Date().getTime();
        if (now - lastCall < delay) return;
        lastCall = now;
        return func(...args);
    };
}

// 自定义滚动条
// 处理滚动条显示逻辑
function showScroll(customScrollbar) {
    if (customScrollbar._scrollHideTimeout) {
        clearTimeout(customScrollbar._scrollHideTimeout); // 清除之前的隐藏定时器
    }
    customScrollbar.style.opacity = '1'; // 显示滚动条
    customScrollbar._scrollHideTimeout = setTimeout(() => {
        customScrollbar.style.opacity = '0'; // 3秒后隐藏滚动条
    }, 3000);
}

// 更新滚动条滑块位置和尺寸
function updateThumb(thumb, container, content, customScrollbar) {
    const scrollHeight = content.scrollHeight; // 滚动区域的总高度
    const containerHeight = container.getBoundingClientRect().height; // 滚动区域的显示高度
    // 内容未溢出或滚动区域过小则隐藏滚动条并返回
    if (Math.round(scrollHeight) <= Math.round(containerHeight)) { // 解决计算精度不同导致的问题
        customScrollbar.style.display = 'none';
        return;
    } else {
        customScrollbar.style.display = 'block';
    }
    const thumbHeight = Math.max((containerHeight / scrollHeight) * containerHeight, 35); // 滑块的高度 最小高度35px,防止滚动条过小
    const maxContentScroll = scrollHeight - containerHeight; // 滑块能到达的最大位置
    const currentScrollTop = Math.round(container.scrollTop); // 当前的滑块位置
    let thumbPosition, thumbTrackSpace;
    if (content.classList.contains('main_with_tab_bar')) customScrollbar.style.top = '100px'; // 这里需要给标签栏预留高度
    if (customScrollbar.classList.contains('primary_custom_scrollbar')) {
        thumbTrackSpace = containerHeight - (thumbHeight + 4); // 4为主要滑块的上下边框高度
    } else {
        thumbTrackSpace = containerHeight - thumbHeight; // 次要滑块没有边框样式
    }
    if (maxContentScroll > 0 && thumbTrackSpace > 0) { // 确保有滚动空间和滑块移动空间
        thumbPosition = (currentScrollTop / maxContentScroll) * thumbTrackSpace;
        thumbPosition = Math.max(0, Math.min(thumbPosition, thumbTrackSpace)); // 限制滑块在有效范围内
    } else {
        thumbPosition = 0; // 滑块置于顶部
    }
    thumb.style.height = `${thumbHeight}px`;
    thumb.style.top = `${thumbPosition}px`;
    customScrollbar.style.height = `${containerHeight}px`;
}

// 处理滚动条点击跳转
function handleScrollbarClick(e, isDragging, customScrollbar, thumb, container, content) {
    if (isDragging || customScrollbar.classList.contains('secondary_custom_scrollbar')) return; // 次要滚动条和拖动中的主要滚动条不能点击跳转

    const {top: scrollbarClientRectTop, height: scrollbarActualHeight} = customScrollbar.getBoundingClientRect();
    const clickClientY = e.clientY;
    const clickPositionInScrollbar = clickClientY - scrollbarClientRectTop;
    const thumbVisualHeight = thumb.offsetHeight; // 滑块的实际可见高度
    const containerVisibleHeight = container.getBoundingClientRect().height;
    const contentScrollHeight = content.scrollHeight;
    const maxContentScroll = contentScrollHeight - containerVisibleHeight;
    if (maxContentScroll <= 0) return;

    const thumbCurrentOffsetTop = thumb.offsetTop; // 滑块相对于其父元素的顶部
    if (clickPositionInScrollbar < thumbCurrentOffsetTop || clickPositionInScrollbar > (thumbCurrentOffsetTop + thumbVisualHeight)) {
        let scrollbarTrackEffectiveHeight = scrollbarActualHeight - (thumbVisualHeight + 4); // 4为主要滑块的上下边框高度

        if (scrollbarTrackEffectiveHeight <= 0) return;

        let targetThumbTop = clickPositionInScrollbar - (thumbVisualHeight / 2); // 让点击点作为新的滑块位置中点
        targetThumbTop = Math.max(0, Math.min(targetThumbTop, scrollbarTrackEffectiveHeight)); // 将滑块限制在轨道内
        const newScrollTop = (targetThumbTop / scrollbarTrackEffectiveHeight) * maxContentScroll; // 根据新的滑块位置计算内容的滚动高度
        container.scrollTop = Math.round(newScrollTop);
    }
}

// 处理滚动事件
function handleScroll(customScrollbar, customThumb, container, content) {
    if (!customScrollbar || !customThumb) return;

    showScroll(customScrollbar);
    requestAnimationFrame(() => { // 动画优化
        updateThumb(customThumb, container, content, customScrollbar);
    });
}

// 处理拖动滚动条的逻辑
function handlePointerMove(e, dragState, thumb, container, content, customScrollbar) {
    if (!dragState.isDragging || customScrollbar.classList.contains('secondary_custom_scrollbar')) return; // 次要滚动条不能拖动

    const currentY = e.clientY || e.touches[0].clientY;
    const deltaY = currentY - dragState.startY;
    const containerHeight = container.getBoundingClientRect().height; // 根据初始位置和移动距离计算新的滑块位置
    const thumbHeight = thumb.offsetHeight;
    const maxThumbTop = containerHeight - thumbHeight;
    const newTop = Math.min(Math.max(dragState.initialThumbTop + deltaY, 0), maxThumbTop); // 计算滑块的新位置,确保在可滑动范围内
    const maxScrollTop = content.scrollHeight - containerHeight; // 计算页面内容的滚动位置

    container.scrollTo({
        top: (newTop / maxThumbTop) * maxScrollTop, behavior: 'instant' // 滚动时不产生动画
    });

    updateThumb(thumb, container, content, customScrollbar);
}

function handlePointerDown(e, customThumb, container, content, dragState, customScrollbar) {
    dragState.isDragging = true;
    dragState.startY = e.clientY || e.touches[0].clientY;
    dragState.initialThumbTop = customThumb.getBoundingClientRect().top - container.getBoundingClientRect().top;
    const handlePointerMoveBound = (e) => handlePointerMove(e, dragState, customThumb, container, content, customScrollbar);

    document.addEventListener('pointermove', handlePointerMoveBound);
    document.addEventListener('touchmove', handlePointerMoveBound);
    const handlePointerUp = () => {
        dragState.isDragging = false;
        document.removeEventListener('pointermove', handlePointerMoveBound);
        document.removeEventListener('touchmove', handlePointerMoveBound);
    };
    document.addEventListener('pointerup', handlePointerUp, {once: true});
    document.addEventListener('touchend', handlePointerUp, {once: true});
}

// 绑定滚动事件的通用函数,使用节流处理滚动事件
function bindScrollEvents(container, content, customScrollbar, customThumb) {
    const dragState = {isDragging: false, startY: 0, initialThumbTop: 0}; // 使用对象管理拖动状态

    const throttledUpdateAndShowScroll = throttle(() => {
        handleScroll(customScrollbar, customThumb, container, content);
    }, 1); // 使用节流函数优化性能(需要即时响应计算的场景)

    const throttledShowOnly = throttle(() => {
        showScroll(customScrollbar);
    }, 100); // 使用节流函数优化性能(仅需显示滚动条的场景)

    // 自定义滚动条精确滚动
    customScrollbar.addEventListener('wheel', (e) => {
        let delta = e.deltaY > 0 ? 10 : -10;
        container.scrollTop += delta;
        throttledUpdateAndShowScroll();
        e.preventDefault();
    });

    // 仅需要显示滚动条的事件
    document.addEventListener('mousemove', throttledShowOnly);
    document.addEventListener('touchmove', throttledShowOnly);
    // 需要显示和更新滚动条的事件
    container.addEventListener('scroll', throttledUpdateAndShowScroll);
    window.addEventListener('resize', throttledUpdateAndShowScroll);
    customThumb.addEventListener('pointerdown', (e) => handlePointerDown(e, customThumb, container, content, dragState, customScrollbar));
    customThumb.addEventListener('touchstart', (e) => handlePointerDown(e, customThumb, container, content, dragState, customScrollbar));
    customScrollbar.addEventListener('click', (e) => handleScrollbarClick(e, dragState.isDragging, customScrollbar, customThumb, container, content));
    window.addEventListener('load', () => setTimeout(throttledUpdateAndShowScroll, 10)); // 页面加载完成后延时触发
}

// 获取并处理所有滚动容器
function initializeScrollContainers() {
    const containers = document.querySelectorAll('.primary_scroll_container, .secondary_scroll_container');

    containers.forEach((container) => {
        // 为当前容器查询核心滚动元素
        const contentElement = container.querySelector('.scroll_container, .sidebar_content');
        const scrollViewElement = contentElement.closest('scroll-view');
        const customScrollbarElement = scrollViewElement.querySelector('custom-scrollbar');
        const customThumbElement = customScrollbarElement.querySelector('custom-scrollbar-thumb');
        bindScrollEvents(container, contentElement, customScrollbarElement, customThumbElement); // 为所有容器绑定标准的滚动事件

        // 监听元素尺寸变化
        const ScrollHandlerForResize = createHandleScroll(customScrollbarElement, customThumbElement, container, contentElement);
        const throttledScrollHandler = throttle(ScrollHandlerForResize, 1);
        const observer = new ResizeObserver(() => {
            throttledScrollHandler();
        }); // 创建ResizeObserver实例
        observer.observe(container); // 观察主容器本身
        observer.observe(contentElement); // 同时观察其内容元素

    });
}

// 初始化滚动容器
document.addEventListener('DOMContentLoaded', function () {
    initializeScrollContainers();
});

// 使用带有内部状态的滚动处理闭包函数
function createHandleScroll(customScrollbar, customThumb, container, content) {
    return function () {
        handleScroll(customScrollbar, customThumb, container, content);
    };
}

// 自定义高度变化检测
const mainScrollContainer = document.querySelector('.primary_scroll_container');
const mainHandleScroll = throttle(createHandleScroll( // NOTE 在有涉及到自定义高度变化的地方要调用这个代码
    document.querySelector('.scroll_container').closest('scroll-view').querySelector('custom-scrollbar'), document.querySelector('.scroll_container').closest('scroll-view').querySelector('custom-scrollbar-thumb'), mainScrollContainer, document.querySelector('.scroll_container')
), 1);


// 加载占位图
function replaceLoadingImages() {
    const loadingImage = rootPath + '/images/Loading_white.gif';
    const loadingImageBlack = rootPath + '/images/Loading.gif';
    const loadingImageError = rootPath + '/images/ErrorMessage.png';
    const blackImageClassList = ['header_left_icon', 'header_right_icon', 'title_icon', 'link_img_black'];

    document.querySelectorAll('img').forEach(img => {

        if (img.dataset.processed === 'true') return; // 避免重复处理
        img.dataset.processed = 'true'; // 标记为已处理

        const originalSrc = img.getAttribute('data-src') || img.src;
        const useBlackImage = blackImageClassList.some(className => img.classList.contains(className));
        const placeholderSrc = useBlackImage ? loadingImageBlack : loadingImage;
        const originalStyle = img.getAttribute('style') || '';
        const isUpdateLogo = img.classList.contains('update_logo');
        const isKeyart = img.classList.contains('keyart');
        img.dataset.originalSrc = originalSrc;// 存储原始图片地址

        // 处理图片的加载和DOM更新
        const processImageLoad = (imageElement, srcToLoad, isRetry = false) => {
            imageElement.classList.remove('image_load_error');
            imageElement.removeEventListener('click', handleRetryClick); // 清理当前元素的点击事件
            imageElement.style.cursor = 'unset'; // 恢复默认光标
            const tempImage = new Image(); // 使用独立的Image对象进行预加载

            tempImage.onload = () => {
                // 图片预加载成功,更新元素
                imageElement.src = srcToLoad;
                if (isUpdateLogo || isKeyart) {
                    imageElement.setAttribute('style', originalStyle);
                }
            };

            tempImage.onerror = () => {
                // 图片预加载失败,更新元素,显示错误图片
                imageElement.src = loadingImageError;
                logManager.log("图片加载失败: " + srcToLoad + " ,点击可重新加载.", 'warn');

                // 启用点击重载功能
                imageElement.classList.add('image_load_error');
                imageElement.style.cursor = 'pointer';
                imageElement.addEventListener('click', handleRetryClick); // 添加点击事件监听器
                setTimeout(updateFocusableElements, 10); // 更新元素焦点
            };

            tempImage.src = srcToLoad; // 开始预加载
        };

        // 点击错误图片时触发的重载逻辑
        const handleRetryClick = (event) => {
            event.stopPropagation(); // 阻止事件冒泡到父元素

            const clickedImage = event.currentTarget; // 获取被点击的图片元素
            clickedImage.classList.remove('image_load_error');
            clickedImage.removeEventListener('click', handleRetryClick); // 移除当前的点击监听器
            clickedImage.style.cursor = 'unset'; // 重载时恢复默认光标
            clickedImage.removeAttribute('tabindex');
            clickedImage.src = placeholderSrc; // 显示加载占位图

            setTimeout(() => {
                logManager.log(`重新加载图片: ${clickedImage.dataset.originalSrc}`);
                processImageLoad(clickedImage, clickedImage.dataset.originalSrc, true); // true表示重载
            }, 10);
        };

        // 设置加载中占位图
        img.src = placeholderSrc;

        // 处理图片加载
        setTimeout(() => {
            processImageLoad(img, originalSrc); // 初始加载
        }, 0);
    });
}

window.addEventListener('load', () => setTimeout(function () {

    replaceLoadingImages(); // 占位图逻辑

    // 禁止拖动元素
    let cantDraggableElements = document.querySelectorAll('img, a');
    cantDraggableElements.forEach(function (cantDraggableElement) {
        cantDraggableElement.draggable = false;
    });

    // 为链接添加点击音效
    let links = document.querySelectorAll('a:not(.sidebar_item)'); // 选择所有类名不为sidebar_item的链接
    links.forEach(link => {
        const originalOnClick = link.getAttribute('onclick');
        if (originalOnClick) { // 如果存在原始的点击事件则先调用原有的再添加
            link.setAttribute('onclick', `playSound('click');${originalOnClick}`);
        } else {
            link.setAttribute('onclick', `playSound('click');`);
        }
    });

}, 10));


// 自定义按钮
class CustomButton extends HTMLElement {
    constructor() {
        super();
        this.render();
    }

    static get observedAttributes() {
        return ['data', 'js', 'text'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        this.render();
        setTimeout(updateFocusableElements, 10); // 更新元素焦点
    }

    render() {
        const data = this.getAttribute('data') || '';
        const [type, status, size, id, isTip, tip, icon] = data.split('|').map(item => item.trim());
        this.status = status || 'normal'; // 状态
        this.icon = icon || '';
        const ctype = type || 'default'; // 样式
        const csize = size || 'middle'; // 大小
        const cid = id || ''; // ID
        const cisTip = isTip === 'true';
        const ctip = tip || '';
        const js = this.getAttribute('js') || 'false'; // 附带函数
        const text = this.getAttribute('text') || ''; // 文本

        if (ctype === 'default') {
            if (cisTip === true) {
                this.innerHTML = `
                    <div class="btn_with_tooltip_cont">
                        <button class="btn ${csize}_btn ${status}_btn" id="${cid}">${text}</button>
                        <div class="btn_tooltip">${ctip}</div>
                        <img alt="" class="tip_icon" src="${rootPath}/images/${icon}.png"/>
                    </div>
                `;
            } else {
                this.innerHTML = `
                    <button class="btn ${csize}_btn ${status}_btn" id="${cid}">${text}</button>
                `;
            }
        } else {
            this.classList.add(ctype + "_custom_btn");
            this.innerHTML = `
                <button class="btn ${status}_btn ${ctype}_btn" id="${cid}">${text}</button>
            `;
        }

        const button = this.querySelector('button');
        if (button) {
            button.addEventListener('click', () => {
                logManager.log(`按钮 ${text} 被点击`);
                playSoundType(button);

                // 创建按钮点击自定义事件
                const buttonClickEvent = new CustomEvent('button-click', {
                    bubbles: true,  // 使事件冒泡
                    cancelable: true,  // 允许取消事件
                });
                this.dispatchEvent(buttonClickEvent);
            });
            if (this.status !== 'disabled') {
                if (js !== 'false') {
                    button.addEventListener('click', () => {
                        try {
                            logManager.log(`按钮 ${text} 执行函数: ${js}`);
                            eval(js);
                        } catch (error) {
                            logManager.log(`按钮 ${text} 执行函数时出错: ${error.message}`, 'error');
                        }
                    });
                }
            }
        }
    }
}

customElements.define('custom-button', CustomButton);


// 自定义Checkbox复选框
class CustomCheckbox extends HTMLElement {
    constructor() {
        super();
        this.beforeToggle = null; // 可被外部设置的钩子函数
        this.render();

        const parentElement = this.parentElement;
        if (parentElement) {
            parentElement.addEventListener('click', this.toggleCheckbox.bind(this));
        }
    }

    static get observedAttributes() {
        return ['status'];
    }

    connectedCallback() {
        this.restoreState(); // 页面加载时恢复状态
    }

    attributeChangedCallback(name, oldValue, newValue) {
        this.render();
        setTimeout(updateFocusableElements, 10); // 更新元素焦点
    }

    render() {
        const active = this.getAttribute('active') || 'off'; // 是否激活
        const status = this.getAttribute('status') || 'disabled'; // 状态

        const isDisabled = status !== 'enabled';
        const isOn = active === 'on';

        this.innerHTML = `
            <div class="custom-checkbox ${isOn ? 'on' : 'off'} ${isDisabled ? 'disabled' : 'enabled'}">
                <img alt="" class="checkmark" src="${rootPath}/images/check_white.png"/>
            </div>
        `;
    }

    shouldAllowToggle() {
        if (typeof this.beforeToggle === 'function') {
            const allowed = this.beforeToggle(this);
            if (!allowed) {
                this.dispatchEvent(new CustomEvent('checkbox-toggle-blocked', {
                    bubbles: true,
                    detail: {checkboxId: this.id}
                }));
                return false;
            }
        }
        return true;
    }

    toggleCheckbox() {
        if (this.getAttribute('status') !== 'enabled') return;
        if (!this.shouldAllowToggle()) return;

        const isChecked = this.getAttribute('active') === 'on';
        const checkboxData = JSON.parse(localStorage.getItem(`(${rootPath}/)checkbox_value`)) || {};
        playSound('click');

        if (isChecked) {
            this.setAttribute('active', 'off');
            logManager.log("关闭复选框 " + this.id);
            if (this.id === 'neverShowIn15Days') {
                localStorage.removeItem(`(${rootPath}/)neverShowIn15Days`);
            } else {
                checkboxData[this.id] = 'off';
            }
        } else {
            this.setAttribute('active', 'on');
            logManager.log("打开复选框 " + this.id);
            if (this.id === 'neverShowIn15Days') {
                localStorage.setItem(`(${rootPath}/)neverShowIn15Days`, Date.now().toString());
            } else {
                checkboxData[this.id] = 'on';
            }
        }

        localStorage.setItem(`(${rootPath}/)checkbox_value`, JSON.stringify(checkboxData));
        this.render();

        // 创建复选框点击自定义事件
        const checkboxClickEvent = new CustomEvent('checkbox-click', {
            bubbles: true,  // 使事件冒泡
            cancelable: true,  // 允许取消事件
        });
        this.dispatchEvent(checkboxClickEvent);
    }

    restoreState() {
        const checkboxData = JSON.parse(localStorage.getItem(`(${rootPath}/)checkbox_value`)) || {};
        const state = checkboxData[this.id];

        if (state) {
            if (this.id === 'neverShowIn15Days') return; // 这个功能有独立的存储
            this.setAttribute('active', state); // 恢复上次状态
        }
    }
}

customElements.define('custom-checkbox', CustomCheckbox);


// 自定义Dropdown下拉菜单
class CustomDropdown extends HTMLElement {
    constructor() {
        super();
        this.margin = 6; // 外边距,与CSS内相同
        this.optionsData = JSON.parse(this.getAttribute('data-option')) || [];
        this.selectedValue = this.getAttribute('data-selected') || null;

        // 创建下拉菜单卡片
        this.label = document.createElement('div');
        this.label.classList.add('dropdown_label');
        this.appendChild(this.label);

        // 创建下拉菜单箭头
        this.arrow = document.createElement('img');
        this.arrow.classList.add('dropdown_arrow');
        this.arrow.src = rootPath + '/images/arrowDown.png';
        this.appendChild(this.arrow);

        // 创建下拉选项容器
        this.dropdownOptions = document.createElement('div');
        this.dropdownOptions.classList.add('dropdown_options');
        this.appendChild(this.dropdownOptions);

        this.optionsData.forEach((label, index) => {
            const option = document.createElement('div');
            option.classList.add('dropdown_option');
            option.setAttribute('data-value', (index + 1).toString());
            option.innerHTML = `${label} <img alt="" class="dropdown_checkmark" src="${rootPath}/images/check_white.png">`;
            option.addEventListener('click', (e) => this.selectOption(e));
            this.dropdownOptions.appendChild(option);
        });

        this.storageKey = `(${rootPath}/)dropdown_value`;
        const storedData = this.getStoredDropdownData();
        this.selectedValue = storedData[this.id] || this.selectedValue;

        this.addEventListener('click', (e) => this.toggleOptions(e));
        this.updateLabel();
        this.renderOptions();
        document.addEventListener('mousedown', (e) => this.handleOutsideClick(e));
        document.addEventListener('touchstart', (e) => this.handleOutsideClick(e));
    }

    static get observedAttributes() {
        return ['status'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'status') {
            this.label.classList.toggle('disabled_dropdown', newValue === 'disabled');
            this.arrow.classList.toggle('disabled_dropdown_arrow', newValue === 'disabled');
        }
        setTimeout(updateFocusableElements, 10); // 更新元素焦点
    }

    getStoredDropdownData() {
        const storedData = localStorage.getItem(this.storageKey);
        return storedData ? JSON.parse(storedData) : {};
    }

    saveDropdownData(data) {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    toggleOptions() {
        if (this.getAttribute('status') === 'disabled') return;

        const isVisible = this.dropdownOptions.style.display === 'block';
        this.dropdownOptions.style.display = isVisible ? 'none' : 'block';
        this.closest('.dropdown_container').style.height = isVisible ? `${this.label.offsetHeight + this.margin}px` : `${this.dropdownOptions.scrollHeight + this.margin}px`; // 根据显示状态切换高度
        logManager.log(`下拉菜单 ${this.id} 选项 ${isVisible ? '隐藏' : '显示'}`);
        playSound('click');
        mainHandleScroll(); // 联动自定义网页滚动条

        // 创建下拉菜单点击自定义事件
        const dropdownClickEvent = new CustomEvent('dropdown-click', {
            bubbles: true,  // 使事件冒泡
            cancelable: true,  // 允许取消事件
        });
        this.dispatchEvent(dropdownClickEvent);
    }

    selectOption(e) {
        if (this.getAttribute('status') === 'disabled') return; // 禁止点击时无法选择

        const option = e.target.closest('.dropdown_option');
        if (!option) return;

        const value = option.getAttribute('data-value');
        if (this.selectedValue !== value) {
            this.selectedValue = value;
            this.updateLabel();
            this.renderOptions();

            const storedData = this.getStoredDropdownData();
            storedData[this.id] = this.selectedValue;
            this.saveDropdownData(storedData);
            logManager.log(`下拉菜单 ${this.id} 选择了选项: ${this.optionsData[value - 1]}`);
        }
    }

    updateLabel() {
        this.label.innerHTML = this.optionsData[this.selectedValue - 1] || this.getAttribute('unselected-text') || '选择一个选项';
        logManager.log(`下拉菜单 ${this.id} 标签设置为: ${this.label.innerHTML}`);

        // 创建下拉菜单值改变自定义事件
        const dropdownValueChangeEvent = new CustomEvent('dropdown-value-change', {
            bubbles: true,  // 使事件冒泡
            cancelable: true,  // 允许取消事件
            detail: {
                value: this.selectedValue, // 传递选中值
            },
        });
        this.dispatchEvent(dropdownValueChangeEvent);
    }

    renderOptions() {
        this.dropdownOptions.querySelectorAll('.dropdown_option').forEach(option => {
            const isSelected = option.getAttribute('data-value') === this.selectedValue;
            option.classList.toggle('selected', isSelected);
            option.querySelector('.dropdown_checkmark').style.display = isSelected ? 'block' : 'none';
        });
    }

    handleOutsideClick(e) {
        // 点击外部区域收起下拉菜单
        const isVisible = this.dropdownOptions.style.display === 'block';
        if (!isVisible) return;
        if (!this.contains(e.target)) {
            this.dropdownOptions.style.display = 'none';
            this.closest('.dropdown_container').style.height = `${this.label.offsetHeight + this.margin}px`; // 根据显示状态切换高度
            logManager.log(`因点击外部, 下拉菜单 ${this.id} 隐藏`);
            mainHandleScroll(); // 联动自定义网页滚动条
        }
    }
}

customElements.define('custom-dropdown', CustomDropdown);


// Modal弹窗
function showModal(modal) {
    const overlay = document.getElementById('overlay_' + modal);
    const frame = document.getElementById(modal);
    overlay.style.display = 'block';
    frame.style.display = 'block';
    frame.focus(); // 将焦点聚集到弹窗上,防止选中弹窗下方元素
    logManager.log("显示弹窗 " + modal);

    // 创建弹窗显示自定义事件
    const modalShowEvent = new CustomEvent('modal-show', {
        bubbles: true,  // 使事件冒泡
        cancelable: true,  // 允许取消事件
    });
    frame.dispatchEvent(modalShowEvent);
}

function hideModal(source) {
    let frameId = null;

    if (source instanceof HTMLElement) {
        let currentElement = source.parentElement;
        while (currentElement) {
            if (currentElement.tagName.toLowerCase() === 'modal_area') {
                frameId = currentElement.id;
                break;
            }
            currentElement = currentElement.parentElement;
        }

        if (!frameId) {
            logManager.log("未在DOM层级中找到弹窗元素", 'warm');
            return;
        }
    } else if (typeof source === 'string') {
        frameId = source;
    } else {
        logManager.log("非法的传入参数类型", 'warm');
        return;
    }

    const overlay = document.getElementById('overlay_' + frameId);
    const frame = document.getElementById(frameId);

    if (!overlay || !frame) {
        logManager.log("找不到弹窗元素,传入参数为: " + frameId, 'warm');
        return;
    }

    overlay.style.display = 'none';
    frame.style.display = 'none';
    logManager.log("隐藏弹窗 " + frameId);

    // 创建弹窗隐藏自定义事件
    const modalHideEvent = new CustomEvent('modal-hide', {
        bubbles: true,  // 使事件冒泡
        cancelable: true,  // 允许取消事件
    });
    frame.dispatchEvent(modalHideEvent);
}

document.querySelectorAll('modal_close_btn').forEach(modal_close_btn => {
    modal_close_btn.addEventListener('click', () => {
        playSoundType(modal_close_btn);
    })
})


// Pop弹窗
function showPop(message, duration, styleClass) {
    const area = document.getElementById('pop_area');
    const pop = document.createElement('div');

    duration = Number(duration);
    if (!Number.isFinite(duration) || duration <= 0) {
        duration = 3000;
    }

    pop.className = 'pop' + (styleClass ? ` ${styleClass}` : '');
    pop.textContent = message;

    setTimeout(() => {
        area.prepend(pop);
        playSound('toast');

        // 插入后触发动画
        requestAnimationFrame(() => {
            void pop.offsetHeight;
            pop.classList.add('show');
        });

        manageVisiblePops(); // 控制最多显示5个

        // 自动移除
        setTimeout(() => {
            pop.classList.remove('show');
            setTimeout(() => {
                // 删除前尝试恢复旧的未到消失时间的pop
                if (area.contains(pop)) {
                    area.removeChild(pop);
                    restoreHiddenPop();
                }
            }, 300);
        }, duration);
    }, 300);
}

function manageVisiblePops() {
    const area = document.getElementById('pop_area');
    const pops = Array.from(area.querySelectorAll('.pop'));

    // 找出所有还未到消失时间的pop
    const visiblePops = pops.filter(p => p.style.display !== 'none' && p.classList.contains('show'));

    if (visiblePops.length >= 5) {
        // 隐藏旧的那个还在显示的pop
        for (let i = pops.length - 1; i >= 0; i--) {
            const p = pops[i];
            if (p.style.display !== 'none' && p.classList.contains('show')) {
                p.style.display = 'none';
                break;
            }
        }
    }
}

function restoreHiddenPop() {
    const area = document.getElementById('pop_area');
    const pops = Array.from(area.querySelectorAll('.pop'));

    // 当前显示的pop数量
    const visibleCount = pops.filter(p => p.style.display !== 'none' && p.classList.contains('show')).length;

    // 只有有空位时才恢复隐藏的pop
    if (visibleCount < 5) {
        for (let i = pops.length - 1; i >= 0; i--) {
            const p = pops[i];
            if (p.style.display === 'none' && p.classList.contains('show')) {
                p.style.display = '';
                break;
            }
        }
    }
}


// 自定义Slider滑块
class CustomSlider extends HTMLElement {
    constructor() {
        super();
        this.isFirstRender = true;
    }

    static get observedAttributes() {
        return ['status'];
    }

    connectedCallback() {
        if (this.isFirstRender) {
            this.render();
            this.isFirstRender = false;
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!this.isFirstRender) {
            this.render();
            setTimeout(updateFocusableElements, 10); // 更新元素焦点
        }
    }

    render() {
        this.innerHTML = `
            <div class="slider_area">
                <div>Selected: <span class="slider_tooltip">0.00</span></div>
                <div class="slider_content">
                    <div class="slider">
                        <div class="slider_process"></div>
                        <div class="slider_slider"></div>
                        <div class="slider_segment" style="display: none"></div>
                    </div>
                </div>
            </div>
        `;

        const content = this.querySelector('.slider_content');
        const tooltip = this.querySelector('.slider_tooltip');
        const slider = this.querySelector('.slider');
        const process = this.querySelector('.slider_process');
        const handle = this.querySelector('.slider_slider');
        const sliderData = JSON.parse(this.getAttribute('data-slider'));
        const minValue = sliderData.minValue; // 最小值
        const maxValue = sliderData.maxValue; // 最大值
        const segments = sliderData.segments; // 分段滑块标识
        const initialValue = sliderData.initialValue || minValue; // 默认值(默认为最小值)
        const showSegments = this.getAttribute('data-show-segments');
        const customSegments = this.getAttribute('data-custom-segments') === 'true';
        const segmentValues = customSegments ? JSON.parse(this.getAttribute('data-segment-values')) : [];
        const isDisabled = this.getAttribute('status') === 'disabled'; // 状态
        const type = this.getAttribute('type');
        const sliderId = this.id; // ID

        let currentValue = initialValue;
        let isDragging = false;

        // 读取存储中的已保存值
        const storedIndex = getSliderValue(sliderId);
        if (storedIndex !== null) {
            currentValue = storedIndex;
        }

        function formatIntegerValue(value) {
            return value.toFixed(2).replace(/\.?0+$/, ''); // 保留两位小数,舍去末尾的0
        }

        function formatDecimalValue(value) {
            return value.toFixed(2); // 始终保留两位小数
        }

        function updateHandle(position) {
            handle.style.left = position + '%';
            process.style.width = position + '%';
        }

        function updateTooltip(position) {
            if (type === 'set') {
                const segmentIndex = Math.round(position / (100 / segments));
                const segmentValue = customSegments ? segmentValues[segmentIndex] : minValue + segmentIndex * (maxValue - minValue) / segments;
                tooltip.textContent = customSegments ? segmentValue : formatIntegerValue(segmentValue); // 这里不保留末尾的0
            } else {
                if (position === 0 || position === 100) {
                    tooltip.textContent = formatIntegerValue(calculateValue(position)); // 这里不保留末尾的0
                } else {
                    tooltip.textContent = formatDecimalValue(calculateValue(position)); // 始终保留两位小数
                }
            }
        }

        function calculatePosition(value) {
            return (value - minValue) / (maxValue - minValue) * 100;
        }

        function calculateValue(position) {
            return position * (maxValue - minValue) / 100 + minValue;
        }

        function changeValue(value) {
            updateHandle(value);
            updateTooltip(value);
            saveSliderValue();

            // 创建滑块值改变自定义事件
            const sliderValueChangeEvent = new CustomEvent('slider-value-change', {
                bubbles: true,  // 使事件冒泡
                cancelable: true,  // 允许取消事件
            });
            slider.dispatchEvent(sliderValueChangeEvent);
        }

        function setSliderValue(position) {
            currentValue = position * (maxValue - minValue) / 100 + minValue;
            changeValue(position);
        }

        function snapToSegment(position) {
            const segmentIndex = Math.round(position / (100 / segments));
            const segmentPosition = segmentIndex * (100 / segments);
            currentValue = minValue + segmentIndex * (maxValue - minValue) / segments;
            changeValue(segmentPosition);
        }

        // 从存储中获取存储的滑块值
        function getSliderValue(sliderId) {
            const sliderStorage = JSON.parse(localStorage.getItem(`(${rootPath}/)slider_value`)) || {};
            return sliderStorage[sliderId] !== undefined ? sliderStorage[sliderId] : null; // 返回存储的索引值
        }

        // 保存滑块值到存储
        function saveSliderValue(segmentIndex = null) {
            const sliderStorage = JSON.parse(localStorage.getItem(`(${rootPath}/)slider_value`)) || {};
            sliderStorage[sliderId] = currentValue;
            localStorage.setItem(`(${rootPath}/)slider_value`, JSON.stringify(sliderStorage));
        }

        // 设置初始值并展示
        updateHandle(calculatePosition(currentValue));
        updateTooltip(calculatePosition(currentValue));
        logManager.log(`滑块 ${sliderId} 值设置为: ${formatIntegerValue(currentValue)}`);

        if (type === 'range') {
            // 添加最小值和最大值提示
            if (showSegments === null || showSegments === 'true') {
                const minValueLabel = document.createElement('div');
                minValueLabel.classList.add('slider_value_info');
                minValueLabel.textContent = formatIntegerValue(minValue);
                minValueLabel.style.position = 'absolute';
                minValueLabel.style.bottom = '-35px'; // 提示和滑块轨道的距离
                slider.appendChild(minValueLabel);
                const minValueLabelWidth = minValueLabel.offsetWidth;
                minValueLabel.style.left = `calc(0% - ${minValueLabelWidth / 2}px)`; // 居中

                const maxValueLabel = document.createElement('div');
                maxValueLabel.classList.add('slider_value_info');
                maxValueLabel.textContent = formatIntegerValue(maxValue);
                maxValueLabel.style.position = 'absolute';
                maxValueLabel.style.bottom = '-35px'; // 提示和滑块轨道的距离
                slider.appendChild(maxValueLabel);
                const maxValueLabelWidth = maxValueLabel.offsetWidth;
                maxValueLabel.style.left = `calc(100% - ${maxValueLabelWidth / 2}px)`; // 居中
            }
        } else if (type === 'set') {
            // 创建分段线和标签
            for (let i = 0; i <= segments; i++) {
                if (i > 0 && i < segments) {
                    const segment = document.createElement('div');
                    segment.classList.add('slider_segment');
                    segment.style.left = `calc(${(i / segments) * 100}% - 1px)`; // 居中(1px为分段线宽度的一半)
                    slider.appendChild(segment);
                }

                if (showSegments === 'true') {
                    const segmentValueLabel = document.createElement('div');
                    const segmentValue = customSegments ? segmentValues[i] : minValue + i * (maxValue - minValue) / segments;
                    segmentValueLabel.classList.add('slider_value_info');
                    segmentValueLabel.textContent = customSegments ? segmentValue : formatIntegerValue(segmentValue);
                    segmentValueLabel.style.position = 'absolute';
                    segmentValueLabel.style.bottom = '-35px'; // 提示和滑块轨道的距离
                    slider.appendChild(segmentValueLabel);
                    const segmentValueLabelWidth = segmentValueLabel.offsetWidth;
                    segmentValueLabel.style.left = `calc(${(i / segments) * 100}% - ${segmentValueLabelWidth / 2}px)`; // 居中
                }
            }
        }

        if (isDisabled) {
            handle.classList.add('disabled_slider');
            slider.classList.add('disabled_slider');
            return;
        }

        const startDrag = (event) => {
            process.style.transition = 'none';
            handle.style.transition = 'none';
            isDragging = true;
            event.preventDefault();
            updatePosition(event);
        };

        const stopDrag = (event) => {
            if (isDragging) {
                const position = currentPosition(event);
                if (type === 'set') {
                    snapToSegment(position);
                } else {
                    setSliderValue(position);
                }
                logManager.log(`拖动结束,滑块 ${sliderId} 值设置为: ${formatIntegerValue(currentValue)}`);
            }
            setTimeout(function () {
                isDragging = false;
            }, 0);
            process.style.transition = 'width 100ms linear';
            handle.style.transition = 'left 100ms linear';
        };

        const updatePosition = (event) => {
            setTimeout(function () {
                if (!isDragging) return;
                const position = currentPosition(event);
                setSliderValue(position);
            }, 0); // 延时防止调用失败
        };

        const currentPosition = (event) => {
            const rect = slider.getBoundingClientRect();
            let position;

            if (event.touches && event.touches.length > 0) {
                position = (event.touches[0].clientX - rect.left) / rect.width * 100;
            } else if (event.changedTouches && event.changedTouches.length > 0) {
                position = (event.changedTouches[0].clientX - rect.left) / rect.width * 100;
            } else if (event.clientX !== undefined) {
                position = (event.clientX - rect.left) / rect.width * 100;
            } else {
                position = 0;
            }

            return Math.max(0, Math.min(position, 100));
        };

        handle.addEventListener('mousedown', startDrag);
        handle.addEventListener('touchstart', startDrag);
        window.addEventListener('mousemove', updatePosition);
        window.addEventListener('touchmove', updatePosition);
        window.addEventListener('mouseup', stopDrag);
        window.addEventListener('touchend', stopDrag);

        // 点击可点击区域移动
        content.addEventListener('click', (event) => {
            if (isDragging) return;
            const position = currentPosition(event);
            if (type === 'set') {
                snapToSegment(position);
            } else {
                setSliderValue(position);
            }
            logManager.log(`移动结束,滑块 ${sliderId} 值设置为: ${formatIntegerValue(currentValue)}`);
        });

        // 通过方向键控制滑块
        handle.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowLeft' || event.key === 'ArrowUp' || event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                event.preventDefault();
                let step = sliderData.step || 1;  // 获取步长
                if (type === 'set') { // 分段滑块
                    let segmentIndex = Math.round(((currentValue - minValue) / (maxValue - minValue)) * segments);
                    if (event.key === 'ArrowLeft') {
                        segmentIndex = Math.max(0, segmentIndex - 1);
                    } else if (event.key === 'ArrowUp') {
                        segmentIndex = segments;
                    } else if (event.key === 'ArrowRight') {
                        segmentIndex = Math.min(segments, segmentIndex + 1);
                    } else if (event.key === 'ArrowDown') {
                        segmentIndex = 0;
                    }
                    currentValue = minValue + segmentIndex * (maxValue - minValue) / segments;
                    const newPosition = (segmentIndex / segments) * 100;
                    snapToSegment(newPosition);
                } else { // 普通滑块
                    if (event.key === 'ArrowLeft') {
                        currentValue = Math.max(minValue, currentValue - step);
                    } else if (event.key === 'ArrowUp') {
                        currentValue = maxValue;
                    } else if (event.key === 'ArrowRight') {
                        currentValue = Math.min(maxValue, currentValue + step);
                    } else if (event.key === 'ArrowDown') {
                        currentValue = minValue;
                    }
                    const newPosition = calculatePosition(currentValue);
                    setSliderValue(newPosition);
                }
                logManager.log(`控制结束,滑块 ${sliderId} 值设置为: ${formatIntegerValue(currentValue)}`);
            }
        });
    }
}

customElements.define('custom-slider', CustomSlider);


// 自定义Switch开关
class CustomSwitch extends HTMLElement {
    constructor() {
        super();
        this.beforeToggle = null; // 可被外部设置的钩子函数
        this.isSwitchOn = false; // 用于存储当前开关的状态
        this.isSwitchDisabled = false; // 用于存储当前开关的禁用状态
        this.startX = 0; // 用于拖动时记录起始位置
        this.isDragging = false; // 用于标识是否正在拖动
        this.render();
    }

    static get observedAttributes() {
        return ['active', 'status'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        this.updateRender();
        setTimeout(updateFocusableElements, 10); // 更新元素焦点
    }

    render() {
        const status = this.getAttribute('status') || 'disabled';
        this.isSwitchDisabled = status !== 'enabled';
        this.isSwitchOn = this.getSwitchValue() === 'on';

        this.innerHTML = `
            <div class="switch_content">
                <div class="switch ${this.isSwitchOn ? 'on' : 'off'} ${this.isSwitchDisabled ? 'disabled_switch' : 'normal_switch'}">
                    <div class="switch_style left"><img alt="" src="${rootPath}/images/switch_on.png"/></div>
                    <div class="switch_style right"><img alt="" src="${rootPath}/images/switch_off.png"/></div>
                    <div class="switch_slider can_click"></div>
                </div>
            </div>
        `;

        this.bindEvents();
    }

    updateRender() {
        // 直接获取当前开关的状态
        this.isSwitchOn = this.getSwitchValue() === 'on';
        this.isSwitchDisabled = this.getAttribute('status') !== 'enabled';

        // 更新元素的类名
        const switchElement = this.querySelector('.switch');
        if (switchElement) {
            switchElement.classList.toggle('on', this.isSwitchOn);
            switchElement.classList.toggle('off', !this.isSwitchOn);
            switchElement.classList.toggle('disabled_switch', this.isSwitchDisabled);
            switchElement.classList.toggle('normal_switch', !this.isSwitchDisabled);
        }
    }

    shouldAllowToggle() {
        if (typeof this.beforeToggle === 'function') {
            const allowed = this.beforeToggle(this);
            if (!allowed) {
                this.dispatchEvent(new CustomEvent('switch-toggle-blocked', {
                    bubbles: true,
                    detail: {switchId: this.id}
                }));
                return false;
            }
        }
        return true;
    }

    bindEvents() {
        const switchElement = this.querySelector('.switch');
        const switchSlider = this.querySelector('.switch_slider');
        logManager.log(`开关 ${this.id} 值设置为: ${this.isSwitchOn}`);

        if (!this.isSwitchDisabled) {
            // 点击和拖动事件
            const handlePointerDown = (e) => {
                this.isDragging = false;
                switchSlider.classList.add('active');
                this.startX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
            };

            const handlePointerMove = (e) => {
                e.preventDefault();
                const currentX = e.type === 'mousemove' ? e.clientX : e.changedTouches[0].clientX;
                const distanceMoved = currentX - this.startX;
                this.isDragging = distanceMoved > 10 || distanceMoved < -10; // 指针移动距离小于10不判定为拖动
            };

            const handlePointerUp = (e) => {
                if (this.isDragging) {
                    const currentX = e.type === 'mouseup' ? e.clientX : e.changedTouches[0].clientX;
                    const distanceMoved = currentX - this.startX;
                    const newState = distanceMoved > 10 ? true : distanceMoved < -10 ? false : this.isSwitchOn;

                    if (newState !== this.isSwitchOn) {
                        if (!this.shouldAllowToggle()) {
                            this.isDragging = false;
                            switchSlider.classList.remove('active');
                            return;
                        }
                        this.isSwitchOn = newState;
                        this.updateSwitchState(this.isSwitchOn);
                    }
                }
                setTimeout(() => {
                    this.isDragging = false;
                    switchSlider.classList.remove('active');
                }, 0); // 延时防止调用失败
            };

            const handleClick = () => {
                if (!this.isDragging) {
                    if (!this.shouldAllowToggle()) return;
                    this.isSwitchOn = !this.isSwitchOn;
                    this.updateSwitchState(this.isSwitchOn);
                }
            };

            // 绑定点击和拖动事件
            const parentElement = this.parentElement.parentElement;
            parentElement.addEventListener('click', handleClick);
            switchElement.addEventListener('mousedown', handlePointerDown);
            switchElement.addEventListener('touchstart', handlePointerDown);
            switchElement.addEventListener('mousemove', handlePointerMove);
            switchElement.addEventListener('touchmove', handlePointerMove);
            document.addEventListener('mouseup', handlePointerUp);
            document.addEventListener('touchend', handlePointerUp);
        }
    }

    updateSwitchState(isOn) {
        this.setAttribute('active', isOn ? 'on' : 'off');
        const switchElement = this.querySelector('.switch');
        const switchSlider = this.querySelector('.switch_slider');

        switchElement.classList.toggle('on', isOn);
        switchElement.classList.toggle('off', !isOn);
        logManager.log(isOn ? "打开开关 " + this.id : "关闭开关 " + this.id);
        playSound('click');

        // 更新存储
        const switchValues = JSON.parse(localStorage.getItem(`(${rootPath}/)switch_value`)) || {};
        switchValues[this.id] = isOn ? 'on' : 'off';
        localStorage.setItem(`(${rootPath}/)switch_value`, JSON.stringify(switchValues));

        // 更新开关类名
        if (isOn) {
            switchSlider.classList.add('switch_bounce_left');
            switchSlider.classList.remove('switch_bounce_right');
        } else {
            switchSlider.classList.add('switch_bounce_right');
            switchSlider.classList.remove('switch_bounce_left');
        }

        const switchStatus = this.querySelector('.switch_status');
        if (switchStatus) {
            switchStatus.textContent = `Toggle: ${isOn ? 'Open' : 'Close'}`;
        }

        this.updateRender(); // 重新渲染以更新状态

        // 创建开关值改变自定义事件
        const switchValueChangeEvent = new CustomEvent('switch-value-change', {
            bubbles: true,  // 使事件冒泡
            cancelable: true,  // 允许取消事件
        });
        this.dispatchEvent(switchValueChangeEvent);
    }

    getSwitchValue() {
        const switchValues = JSON.parse(localStorage.getItem(`(${rootPath}/)switch_value`)) || {};
        if (this.id in switchValues) {
            return switchValues[this.id];
        }
        return this.getAttribute('active') || 'off';
    }
}

customElements.define('custom-switch', CustomSwitch);


// 自定义TextField文本框
class TextField extends HTMLElement {
    constructor() {
        super();
        const type = this.getAttribute('type') || 'text';
        const isSingleLine = this.getAttribute('single-line') || 'true';
        const maxLength = parseInt(this.getAttribute('max-length')) || null; // 获取最大长度
        this.inputField = document.createElement('textarea');
        this.inputField.classList.add('input');
        this.inputField.rows = 1; // 按单行计算
        this.appendChild(this.inputField);
        this.hint = document.createElement('div');
        this.hint.classList.add('hint');
        this.hint.textContent = this.getAttribute('hint') || '';
        this.appendChild(this.hint);

        if (isSingleLine === 'true') {
            this.inputField.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault(); // 阻止换行
                }
            });
        }

        this.inputField.addEventListener('focus', () => {
            this.hint.style.opacity = '0';
        });

        this.inputField.addEventListener('blur', () => {
            this.updateHint();
        });

        this.isComposing = false;
        this.inputField.addEventListener('compositionstart', () => {
            this.isComposing = true;// 标记输入法状态
        });

        this.inputField.addEventListener('compositionend', () => {
            this.isComposing = false;
            setTimeout(() => {  // 延迟执行验证
                this.validateLength(maxLength);
                const inputValue = this.inputField.value;
                const {isValid, filtered} = this.isValidAndFilterInput(inputValue, type);
                if (!isValid) {
                    this.inputField.value = filtered; // 过滤掉非法字符

                    // 创建文本框过滤非法字符自定义事件
                    const textfieldInvalidInputEvent = new CustomEvent('textfield-invalid-input', {
                        bubbles: true,  // 使事件冒泡
                        cancelable: true,  // 允许取消事件
                    });
                    this.dispatchEvent(textfieldInvalidInputEvent);

                    return; // 不保存到存储,直接返回
                }
                this.saveTextFieldValue(); // 有效输入才保存
            }, 0);
        });

        this.inputField.addEventListener('beforeinput', (e) => {
            if (!this.isComposing) { // 如果没有使用输入法
                // e.data可能为空(如删除操作)
                if (e.data) {
                    const {isValid} = this.isValidAndFilterInput(e.data, type);
                    if (!isValid) {
                        e.preventDefault(); // 阻止非法输入

                        // 创建文本框过滤非法字符自定义事件
                        const textfieldInvalidInputEvent = new CustomEvent('textfield-invalid-input', {
                            bubbles: true,  // 使事件冒泡
                            cancelable: true,  // 允许取消事件
                        });
                        this.dispatchEvent(textfieldInvalidInputEvent);
                    }
                }
            }
        });

        this.inputField.addEventListener('input', () => {
            // 在输入法组合输入过程中不应立即处理,等待compositionend
            if (this.isComposing) {
                return;
            }
            this.validateLength(maxLength); // 验证长度
            this.updateTextField();
            // 仅在输入有效时保存
            if (this.isValidAndFilterInput(this.inputField.value, type).isValid) {
                this.saveTextFieldValue();

                // 创建文本框值改变自定义事件
                const textfieldValueChangeEvent = new CustomEvent('textfield-value-change', {
                    bubbles: true,  // 使事件冒泡
                    cancelable: true,  // 允许取消事件
                });
                this.dispatchEvent(textfieldValueChangeEvent);
            }
        });
    }

    static get observedAttributes() {
        return ['status'];
    }

    connectedCallback() {
        // 元素被添加到DOM后执行,获取父节点信息
        if (this.parentNode && this.parentNode.id) {
            this.classList.add(this.parentNode.id);
        }


        this.getTextFieldValue(); // 先获取值

        // 使用requestAnimationFrame确保在浏览器下一次重绘前更新文本框
        requestAnimationFrame(() => {
            this.updateTextField();
        });

        // 如果元素在连接到DOM时已经有status属性,也需要处理
        if (this.hasAttribute('status')) {
            this.classList.toggle('disabled_text_field', this.getAttribute('status') === 'disabled');
            if (this.inputField) { // 确保inputField存在
                this.inputField.disabled = (this.getAttribute('status') === 'disabled');
            }
        }
    }

    validateLength(maxLength) {
        const content = this.inputField.value;
        const length = content.length;

        if (maxLength !== null && length > maxLength) {
            this.inputField.value = content.substring(0, maxLength); // 如果超过最大长度则截断
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'status') {
            const isDisabled = (newValue === 'disabled');
            this.classList.toggle('disabled_text_field', isDisabled);
            if (this.inputField) { // 确保inputField存在
                this.inputField.disabled = isDisabled;
                this.updateHint();
            }
        }
        setTimeout(updateFocusableElements, 10); // 更新元素焦点
    }

    updateTextField() {
        this.updateHint();
        this.autoResize();
    }

    updateHint() {
        const content = this.inputField.value;
        const isFocused = document.activeElement.isSameNode(this.inputField);
        const isDisabled = this.inputField.disabled;
        if (content.length === 0 && (!isFocused || isDisabled)) {
            this.hint.style.opacity = '1'; // 显示提示
        } else {
            this.hint.style.opacity = '0'; // 隐藏提示
        }
    }

    autoResize() {
        // 先将高度设置为auto,以便scrollHeight能够反映实际内容所需高度
        this.inputField.style.height = 'auto';

        let scrollH = this.inputField.scrollHeight; // 获取textarea内容的实际滚动高度

        // 获取CSS中定义的min-height值
        let cssMinHeight = 0;
        const computedStyle = getComputedStyle(this.inputField);
        if (computedStyle && computedStyle.minHeight && computedStyle.minHeight.endsWith('px')) {
            cssMinHeight = parseFloat(computedStyle.minHeight);
        }

        // JavaScript层面设定的最小高度是40px,但要优先考虑CSS的min-height
        const effectiveMinHeight = Math.max(cssMinHeight);
        let targetHeight = Math.max(scrollH, effectiveMinHeight);

        this.inputField.style.height = targetHeight + 'px';
        // 调整自定义元素本身的高度以匹配输入区域
        this.style.height = targetHeight + 'px';

        // 设置容器高度(可能会导致渲染问题)
        // const container = this.parentNode;
        // container.style.height = targetHeight + 'px';
        mainHandleScroll(); // 联动自定义网页滚动条
    }

    isValidAndFilterInput(input, type) {
        // 针对默认类型或全通类型提前返回
        if (type === 'text' || type === 'all' || !type) {
            return {isValid: true, filtered: input === null ? '' : input};
        }

        if (!input && input !== '') return {isValid: true, filtered: input === null ? '' : input}; // 处理input为null或undefined的情况,但允许空字符串进一步处理

        let regex;
        let filteredInput;

        switch (type) {
            case 'number':
                regex = /^[0-9]*$/;
                filteredInput = input.replace(/[^0-9]/g, ''); // 过滤非数字字符
                break;
            case 'letter':
                regex = /^[a-zA-Z]*$/;
                filteredInput = input.replace(/[^a-zA-Z]/g, ''); // 过滤非字母字符
                break;
            case 'operator':
                regex = /^[`!@#$%^&*()\-_=+[\]{};':"\\|,.<>\/?~]*$/;
                filteredInput = input.replace(/[^`!@#$%^&*()\-_=+[\]{};':"\\|,.<>\/?~]/g, ''); // 过滤非符号字符
                break;
            case 'base':
                regex = /^[0-9a-zA-Z `!@#$%^&*()\-_=+[\]{};':"\\|,.<>\/?~]*$/;
                filteredInput = input.replace(/[^0-9a-zA-Z `!@#$%^&*()\-_=+[\]{};':"\\|,.<>\/?~]/g, ''); // 过滤非基本字符
                break;
            case 'none':
                return {isValid: input.length === 0, filtered: ''}; // 不允许任何字符
            default:
                return {isValid: true, filtered: input}; // 默认允许所有字符
        }

        // 返回有效性和过滤后的输入
        return {isValid: regex.test(input), filtered: filteredInput};
    }

    getValue() {
        return this.inputField.value;
    }

    resetValue() {
        this.inputField.value = '';
        this.updateTextField();
        this.saveTextFieldValue();
    }

    saveTextFieldValue() {
        const storageKey = `(${rootPath}/)text_field_value`;
        let storedData;
        try {
            storedData = JSON.parse(localStorage.getItem(storageKey)) || {};
        } catch (e) {
            logManager.log("获取文本框本地存储数据时出现错误: " + e, 'error');
            storedData = {};
        }

        const currentValue = this.inputField.value;
        if (this.parentElement && this.parentElement.classList.contains('do_not_save')) return;

        const keyInStoredData = this.classList[0];

        if (typeof keyInStoredData !== 'string' || keyInStoredData.trim() === '') {
            logManager.log("获取文本框类名出错! 无法保存数据.", 'warm');
            return;
        }

        if (currentValue.length === 0) {
            delete storedData[keyInStoredData];
        } else {
            storedData[keyInStoredData] = currentValue;
        }
        try {
            localStorage.setItem(storageKey, JSON.stringify(storedData)); // 更新存储
        } catch (e) {
            logManager.log("保存文本框数据时出现错误: " + e, 'error');
        }
    }

    getTextFieldValue() {
        const storageKey = `(${rootPath}/)text_field_value`;
        let storedData;
        try {
            storedData = JSON.parse(localStorage.getItem(storageKey)) || {};
        } catch (e) {
            logManager.log("获取文本框数据出错: " + e, 'error');
            storedData = {};
        }

        const keyInStoredData = this.classList[0];
        if (typeof keyInStoredData !== 'string' || keyInStoredData.trim() === '') {
            logManager.log("获取文本框类名出错! 无法加载数据.", 'warm');
            if (this.inputField) {
                this.inputField.value = ''; // 默认值
            }
            return;
        }

        if (storedData[keyInStoredData]) {
            this.inputField.value = storedData[keyInStoredData]; // 设置已保存的值
        } else {
            this.inputField.value = ''; // 默认值
        }
    }
}

customElements.define('text-field', TextField);
