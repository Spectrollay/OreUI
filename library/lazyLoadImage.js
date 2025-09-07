class LazyLoadImage {
    constructor(selector) {
        this.images = document.querySelectorAll(selector);
    }

    init() {
        if ('IntersectionObserver' in window) {
            this.observeWithIntersectionObserver();
        } else {
            this.loadImagesImmediately();
        }
    }

    observeWithIntersectionObserver() {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        });

        this.images.forEach(image => {
            observer.observe(image);
        });
    }

    loadImagesImmediately() {
        this.images.forEach(image => this.loadImage(image));
    }

    loadImage(image) {
        const src = image.getAttribute('data-src');
        if (src) {
            image.src = src;
        }
    }
}

// Export the class for usage in other scripts
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = LazyLoadImage;
}
