"use strict"
const lightbox = document.querySelector('.lightbox')
let figures = document.querySelectorAll('figure.article-image')
const lightboxClose = document.querySelector('.lightbox-close')
const prev = document.querySelector('.lightbox-prev')
const next = document.querySelector('.lightbox-next')
const lightboxFigure = lightbox.querySelector('figure')

lightboxClose.addEventListener('click', () => {
    closeLightbox()
})

document.addEventListener('keyup', (event) => {
    if (event.key === 'Escape') {
        closeLightbox()
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        previousLightbox()
    }
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        nextLightbox()
    }
})

class Flip {
    /**
     * @param {HTMLElement} element 
     * @returns {DOMRect}
     */
    setFirstState(element) {
        this.firstState = element.getBoundingClientRect()
        return this.firstState
    }
    /**
     * @param {HTMLElement} element 
     * @returns {DOMRect}
     */
    setLastState(element) {
        this.lastState = element.getBoundingClientRect()
        return this.lastState
    }
    /**
     * 
     * @param {DOMRect} firstState 
     * @param {DOMRect} lastState 
     * @returns {{ x: Number, y: Number, scaleX: Number, scaleY: Number }} Delta
     */
    getDelta(firstState, lastState) {
        const first = this.firstState ?? firstState
        const last = this.lastState ?? lastState
        if (!first) throw Error('Please capture first state before calculating delta.')
        if (!last) throw Error('Please capture last state before calculating delta.')
        const validDOMRect = first instanceof DOMRect && last instanceof DOMRect
        if (!validDOMRect) {
            throw Error('First and Last state should follow or implement the shape of a DOMRect object.')
        }
            
        const delta = {
            x: -1 * (last.left - first.left),
            y: -1 * (last.top - first.top),
            // x: last.left - first.left,
            // y: last.top - first.top,
            scaleX: first.width / last.width,
            scaleY: first.height / last.height
        }
        return delta
    }
    /**
     * @param {HTMLElement} element 
     */
    invert(element) {
        const first = this.firstState
        const last = this.lastState ?? element.getBoundingClientRect()
        const delta = this.getDelta(first, last)

        if (!element) throw Error('Invert requires an element to apply transform to.')

        element.style.transformOrigin = 'top left'
        element.style.transform = `
            translate(${delta.x}px, ${delta.y}px)
            scale(${delta.scaleX}, ${delta.scaleY})`
    }
    /**
     * @param {HTMLElement} element 
     */
    play(element) {
        requestAnimationFrame(() => {
            element.classList.add('animate')
            element.style.transform = 'none'
        })
    }
    clearStates() {
        this.firstState = null
        this.lastState = null
    }
}

const imageFLIP = new Flip()
const figcaptionFLIP = new Flip()

function isObjectEmpty(object) {
    return Object.keys(object).length === 0
}

/**
 * @param {MouseEvent & { target: HTMLImageElement }} event
 */
function handleImgClick(event) {
    const target = event.target
    /** @type HTMLElement */
    const figure = target.parentNode
    const key = Number(figure.dataset.key)
    const figcaption = figure.querySelector('figcaption')

    const imgClone = target.cloneNode()
    imgClone.addEventListener('click', handleImgClick, { capture: true })
    imgClone.addEventListener('transitionend', handleImgTransitionend, { capture: true })
    imgClone.classList.add('cursor-pointer')
    const figcaptionClone = figcaption.cloneNode(true)

    // FLIP First state
    imageFLIP.setFirstState(target)
    figcaptionFLIP.setFirstState(figcaption)

    // Make DOM manipulations
    lightboxFigure.appendChild(target)
    lightboxFigure.appendChild(figcaption)
    figure.append(imgClone)
    figure.append(figcaptionClone)

    openLightbox(target.src, figcaption.textContent, key)

    // FLIP set LAST state and Invert
    imageFLIP.invert(target)
    figcaptionFLIP.invert(figcaption)
    // FLIP play transition
    imageFLIP.play(target)
    figcaptionFLIP.play(figcaption)

    // remove click event listener on this specific img
    target.classList.remove('cursor-pointer')
    target.removeEventListener('click', handleImgClick, { capture: true })
}

/**
 * @param {TransitionEvent & { target: HTMLImageElement }} event
 */
function handleImgTransitionend({ target }) {
    target.classList.remove('animate')
    lightbox.classList.remove('lightbox-fade-out')
    lightbox.classList.add('lightbox-fade-in')
}

function attachImgClickListeners(figures) {
    if (!figures) figures = document.querySelectorAll('figure.article-image');

    figures.forEach(
        /**
         * 
         * @param {HTMLElement} figure 
         * @param {Number} key 
         */
        (figure, key) => {
            const img = figure.querySelector('img')
            const caption = figure.querySelector('figcaption').textContent
            figure.dataset.key = `${key}`

            img.addEventListener('click', handleImgClick, { capture: true })
            img.classList.add('cursor-pointer')
            img.addEventListener("transitionend",  handleImgTransitionend, { capture: true })
        }
    )
}

prev.addEventListener('click', () => {
    previousLightbox()
})

next.addEventListener('click', () => {
    nextLightbox()
})

/**
 * https://www.kirupa.com/html5/detecting_touch_swipe_gestures.htm
 */
lightboxFigure.addEventListener("touchstart", startTouch, false)
lightboxFigure.addEventListener("touchmove", moveTouch, false)
lightboxFigure.addEventListener("touchend", endTouch, false)

let initialX = null
let initialY = null
let diffX = null
let diffY = null

function openLightbox(src, caption, key) {
    // lightbox.querySelector('img').src = src
    // lightbox.querySelector('figcaption').textContent = caption
    lightbox.dataset.current = key
    lightbox.classList.remove('hidden')
    disableScroll()
}

/**
 * @param {TransitionEvent & { target: HTMLElement }} event `
 */
function clearLightboxFigureChildren(event) {
    setTimeout(() => {
        event.target.replaceChildren()
        document.querySelector('.lightbox').classList.add('hidden')
        document.querySelector('.lightbox').classList.remove('lightbox-fade-out')
        event.target.removeEventListener('animationend', clearLightboxFigureChildren, { capture: true })
    }, 250)
}

function closeLightbox() {
    const lightboxFigure = lightbox.querySelector('figure')
    lightboxFigure.addEventListener('animationend', clearLightboxFigureChildren, { capture: true })
    lightbox.classList.remove('lightbox-fade-in')
    lightbox.classList.add('lightbox-fade-out')
    
    // setTimeout(() => {
    //     const lightboxFigure = lightbox.querySelector('figure')
    //     lightboxFigure.replaceChildren()
    //     document.querySelector('.lightbox').classList.add('hidden')
    //     document.querySelector('.lightbox').classList.remove('lightbox-fade-out')
    //     lightboxFigure.addEventListener('transitionend', clearLightboxFigureChildren, { capture: true })
    // }, 250)
    
    enableScroll()
}

function previousLightbox() {
    let current = Number(lightbox.dataset.current)
    current = current === 0
        ? figures.length - 1
        : current - 1
    // if (current === 0) {
    //     current = figures.length - 1
    // } else {
    //     current--
    // }

    lightbox.querySelector('img').src = figures[current].querySelector('img').src
    lightbox.querySelector('figcaption').textContent = figures[current].querySelector('figcaption').textContent

    lightbox.dataset.current = current
    console.log("Current image key: ", current)
}

function nextLightbox() {
    let current = Number(lightbox.dataset.current)
    current = current === figures.length - 1
        ? 0
        : current + 1
    // if (current === figures.length - 1) {
    //     current = 0
    // } else {
    //     current++
    // }

    lightbox.querySelector('img').src = figures[current].querySelector('img').src
    lightbox.querySelector('figcaption').textContent = figures[current].querySelector('figcaption').textContent

    lightbox.dataset.current = current
    console.log("Current image key: ", current)
}

function startTouch(event) {
    initialX = event.touches[0].clientX
    initialY = event.touches[0].clientY
    event.stopPropagation();
    event.stopImmediatePropagation();
}

/**
 * 
 * @param {TouchEvent & { target: HTMLElement }} event 
 * @returns {void}
 */
function moveTouch(event) {
    event.preventDefault();

    if (initialX === null || initialY === null) return;

    const currentX = event.touches[0].clientX
    const currentY = event.touches[0].clientY
    event.target.classList.add('animate')
    diffX = initialX - currentX
    diffY = initialY - currentY

    if (Math.abs(diffX) > Math.abs(diffY)) {
        // sliding horizontally
        diffX > 0
            // swiped left
            ? event.target.style.transform = `translateX(-${diffX}px)`
            // swiped right
            : event.target.style.transform = `translateX(${Math.abs(diffX)}px)`
    } else {
        // sliding vertically
        diffY > 0
            // swiped up
            ? event.target.style.transform = `translateY(-${diffY}px)`
            // swiped down
            : event.target.style.transform = `translateY(${Math.abs(diffY)}px)`
    }

    // initialX = null
    // initialY = null
}

function endTouch(event) {
    event.target.classList.add('animate')
    if (Math.abs(diffX) > Math.abs(diffY)) {
        // sliding horizontally
        if (diffX > 0) {
            // swiped left
            event.target.style.transform = `translateX(0px)`
            previousLightbox()
        } else {
            // swiped right
            event.target.style.transform = `translateX(0px)`
            nextLightbox()
        }  
    } else {
        // sliding vertically
        if (diffY > 0) {
            // swiped up
            event.target.style.transform = `translateY(0px)`
            previousLightbox()
        } else {
            // swiped down
            event.target.style.transform = `translateY(0px)`
            nextLightbox()
        }  
    }

    initialX = null
    initialY = null
}

function disableScroll() {
    document.body.style.overflow = 'hidden'
}

function enableScroll() {
    document.body.style.overflow = 'auto'
}

attachImgClickListeners(figures)
