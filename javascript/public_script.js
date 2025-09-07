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

// 路径检测
const currentURL = window.location.href;
const currentPagePath = window.location.pathname;
let hostPath = window.location.origin;
const parts = currentPagePath.split('/').filter(Boolean);
let rootPath = '/' + (parts.length > 0 ? parts[0] : '');
const slashCount = (currentPagePath.match(/\//g) || []).length;

// 日志管理器
window.logManager = {
    log: function (message, level = 'info') {
        const isLocalEnv = hostPath.includes('localhost') || rootPath.includes('_test');
        const formattedMessage = `[${level.toUpperCase()}]: ${message}`;
        const logFunction = console[level] || console.log;
        if (level === 'error') {
            logFunction.call(console, formattedMessage);
            console.trace(); // 输出堆栈追踪
        } else if (isLocalEnv) {
            logFunction.call(console, formattedMessage);
            console.trace(); // 在测试和开发环境中也输出
        }
    }
};

// 检测浏览器是否处于夜间模式
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.classList.add('no-dark-mode'); // 覆盖夜间模式下的样式
}

// 响应式设计动画
document.addEventListener('DOMContentLoaded', function () {
    const mainScrollView = document.querySelector('.main_scroll_view.with_sidebar');
    if (mainScrollView) {
        window.addEventListener('resize', function () {
            mainScrollView.classList.add('animate');
        });
    }
});

// 点击顶栏回到顶部
document.addEventListener('DOMContentLoaded', function () {
    document.querySelector('.header_logo').addEventListener('click', scrollToTop);
});

// 跳转判定
let isNavigating = false;

function ifNavigating(way, url) {
    if (isNavigating) {
        return; // 防止重复点击
    }
    isNavigating = true; // 设置状态,正在跳转
    if (way === 'direct') {
        window.location.href = url;
    } else if (way === 'open') {
        setTimeout(function () {
            window.open(url);
            setTimeout(function () {
                isNavigating = false; // 重置状态,允许下一次点击
            }, 100);
        }, 100);
    } else if (way === 'delayed_open') {
        setTimeout(function () {
            window.open(url);
            setTimeout(function () {
                isNavigating = false; // 重置状态,允许下一次点击
            }, 100);
        }, 1500);
    } else if (way === 'jump') {
        setTimeout(function () {
            window.location.href = url;
            setTimeout(function () {
                isNavigating = false; // 重置状态,允许下一次点击
            }, 100);
        }, 600);
    }
}

logManager.log("浏览器UA: " + navigator.userAgent)
logManager.log("完整路径: " + currentURL);
logManager.log("来源: " + hostPath);
logManager.log("根路径: " + rootPath);
logManager.log("当前路径: " + currentPagePath);
logManager.log("当前位于" + (slashCount - 1) + "级页面");

if (hostPath.includes('file:///')) {
    logManager.log("当前运行在本地文件");
} else if (hostPath.includes('localhost')) {
    logManager.log("当前运行在本地服务器");
} else {
    logManager.log("当前运行在" + hostPath);
    // 禁用右键菜单
    document.addEventListener('contextmenu', function (event) {
        event.preventDefault();
    });
    // 禁用长按菜单
    document.addEventListener('touchstart', function (event) {
        event.preventDefault();
    });
}
if (rootPath.includes('_test')) {
    document.body.classList.add('test');
    logManager.log("当前为开发环境");
} else {
    logManager.log("当前为发布环境");
}

// 输出错误日志
window.addEventListener('error', function (event) {
    logManager.log("错误: " + event.message, 'error');
});

document.addEventListener('DOMContentLoaded', function () {
    logManager.log("页面加载完成!");
});

const startTime = new Date().getTime();
window.addEventListener('load', function () {
    const endTime = new Date().getTime();
    let loadTime = endTime - startTime;
    logManager.log("页面加载耗时: " + loadTime + "ms");
});

// 页面加载时缓存音效文件
const cacheName = 'audio-cache';
window.onload = async function () {
    if ('caches' in window) {
        try {
            const cache = await caches.open(cacheName);
            await cache.addAll([soundPaths['click'], soundPaths['button'], soundPaths['open'], soundPaths['close']]);
            logManager.log("音效文件已缓存!");
        } catch (error) {
            logManager.log("音效文件缓存失败: " + error, 'error');
        }
    }
};

async function getCachedAudio(filePath) {
    if ('caches' in window) {
        try {
            const cache = await caches.open(cacheName);
            const response = await cache.match(filePath);
            if (response) {
                const blob = await response.blob();
                const audioURL = URL.createObjectURL(blob);
                logManager.log("从缓存获取音效文件");
                return new Audio(audioURL); // 返回缓存中的音效
            } else {
                logManager.log("缓存中未找到音效文件,尝试直接从链接加载");
            }
        } catch (error) {
            logManager.log("从缓存获取音效文件失败: " + error, 'error');
        }
    } else {
        logManager.log("浏览器不支持缓存API,直接加载音效");
    }
    // 如果缓存获取失败直接返回网络资源
    return new Audio(filePath);
}

// 音效设置
const soundPaths = {
    click: rootPath + '/sounds/click.ogg',
    button: rootPath + '/sounds/button.ogg',
    pop: rootPath + '/sounds/pop.ogg',
    hide: rootPath + '/sounds/hide.ogg',
    open: rootPath + '/sounds/drawer_open.ogg',
    close: rootPath + '/sounds/drawer_close.ogg',
    toast: rootPath + '/sounds/toast.ogg'
};

function playSound(type) {
    const soundPath = soundPaths[type];
    if (!soundPath) {
        logManager.log(`未知的音效类型: ${type}`, 'error');
        return;
    }

    getCachedAudio(soundPath).then(audio => {
        audio.play().then(() => {
            logManager.log(`${type}音效播放成功!`);
        }).catch(error => {
            logManager.log(`${type}音效播放失败: ${error}`, 'error');
        });
    }).catch(error => {
        logManager.log(`获取${type}音效失败: ${error}`, 'error');
    });
}

// 按键音效
function playSoundType(button) {
    if (button.classList.contains('normal_btn') || button.classList.contains('red_btn') || button.classList.contains('sidebar_btn') || (button.classList.contains('tab_bar_btn') && button.classList.contains('no_active')) || button.classList.contains('close_btn') || button.classList.contains('header_item')) {
        playSound('click');
    } else if (button.classList.contains('green_btn')) {
        playSound('button');
    }
}

// 点击返回按钮事件
function clickedBack() {
    logManager.log("点击返回");
    playSound('click');
    setTimeout(function () {
        if (window.history.length <= 1) {
            logManager.log("关闭窗口");
            window.close();
        } else {
            logManager.log("返回上一级页面");
            window.history.back();
        }
    }, 600);
}

// 打开网页
function openLink(url) {
    if (url.includes('mcarc.github.io')) { // TODO 在移除全部相关链接后删除判定
        ifNavigating('open', '/minecraft_repository_test/default/error_not-found.html');
    } else {
        ifNavigating('open', url);
    }
}

function delayedOpenLink(url) { // TODO 在页面完成迭代后移除
    setTimeout(function () {
        ifNavigating('open', url);
    }, 1500);
}

function launchApplication(deeplink) {
    window.location.assign(deeplink);
}

// 滚动到网页顶部
function scrollToTop() {
    mainScrollContainer.scrollTo({
        top: 0, behavior: 'smooth'
    });
    console.log("成功执行回到顶部操作");
}

// 跳转到网页顶部
function toTop() {
    mainScrollContainer.scrollTo({
        top: 0, behavior: 'instant'
    });
}
