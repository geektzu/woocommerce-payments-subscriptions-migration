class K12_Slider_1 {
	constructor(sliderElement, dotsElement, visibleSlides = 1) {
		this.sliderElement = sliderElement;
		this.dotsElement = dotsElement;

		this.prevButton = document.querySelector(
			'section.wp-block-k12-one-col-img-p-p-slider .slider-nav-prev'
		);
		this.nextButton = document.querySelector(
			'section.wp-block-k12-one-col-img-p-p-slider .slider-nav-next'
		);

		this.slides = Array.from(sliderElement.querySelectorAll('.slide'));
		this.dots = Array.from(dotsElement.querySelectorAll('.dot'));

		this.visibleSlides = visibleSlides;
		this.initialize();
	}

	initialize() {
		this.currentSlideIndex = 0;
		this.isDragging = false;
		this.startX = 0;
		this.currentX = 0;

		this.sliderElement.addEventListener(
			'touchstart',
			this.onTouchStart.bind(this)
		);
		this.sliderElement.addEventListener(
			'touchmove',
			this.onTouchMove.bind(this)
		);
		this.sliderElement.addEventListener(
			'touchend',
			this.onTouchEnd.bind(this)
		);
		this.dots.forEach((dot, index) => {
			dot.addEventListener('click', () => {
				this.navigateToSlide(index);
			});
		});

		this.navigateToSlide(this.currentSlideIndex);

		this.prevButton.addEventListener('click', () => {
			this.prev();
		});

		this.nextButton.addEventListener('click', () => {
			this.next();
		});
	}

	onTouchStart(event) {
		event.preventDefault();
		this.isDragging = true;
		this.startX = event.touches[0].clientX;
	}

	onTouchMove(event) {
		if (!this.isDragging) return;
		this.currentX = event.touches[0].clientX;
		const dx = this.currentX - this.startX;
		this.sliderElement.style.transition = 'none';
		this.sliderElement.style.transform = `translateX(${
			-this.currentSlideIndex * (100 / this.visibleSlides) +
			(dx / this.sliderElement.clientWidth) * (100 / this.visibleSlides)
		}%)`;
	}

	onTouchEnd() {
		if (!this.isDragging) return;
		const dx = this.currentX - this.startX;
		const threshold = this.sliderElement.clientWidth * 0.1;

		if (dx > threshold && this.currentSlideIndex > 0) {
			this.navigateToSlide(this.currentSlideIndex - 1);
		} else if (
			dx < -threshold &&
			this.currentSlideIndex < this.slides.length - this.visibleSlides
		) {
			this.navigateToSlide(this.currentSlideIndex + 1);
		} else {
			this.navigateToSlide(this.currentSlideIndex);
		}

		this.isDragging = false;
	}

	navigateToSlide(index) {
		this.sliderElement.style.transition = 'transform 0.5s';
		this.sliderElement.style.transform = `translateX(${
			-index * (100 / this.visibleSlides)
		}%)`;

		this.dots.forEach((dot, i) => {
			dot.dataset.active = i === index;
		});

		this.currentSlideIndex = index;
	}

	next() {
		this.navigateToSlide(
			this.currentSlideIndex + 1 <
				this.slides.length - this.visibleSlides + 1
				? this.currentSlideIndex + 1
				: this.slides.length - this.visibleSlides
		);
	}

	prev() {
		this.navigateToSlide(
			this.currentSlideIndex - 1 > 0 ? this.currentSlideIndex - 1 : 0
		);
	}
}

document.addEventListener('DOMContentLoaded', () => {
	const sliderElement = document.querySelectorAll(
		'section.wp-block-k12-one-col-img-p-p-slider .slides-wrapper'
	);
	const dotsElement = document.querySelectorAll(
		'section.wp-block-k12-one-col-img-p-p-slider .dots'
	);
	const visibleSlides = 1;

	sliderElement.forEach((sliderElement, index) => {
		new K12_Slider_1(sliderElement, dotsElement[index], visibleSlides);
	});
});
