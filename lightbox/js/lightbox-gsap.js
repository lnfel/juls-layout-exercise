const lightbox = document.querySelector('.lightbox')
let figures = document.querySelectorAll('figure.article-image')
const lightboxClose = document.querySelector('.lightbox-close')
const prev = document.querySelector('.lightbox-prev')
const next = document.querySelector('.lightbox-next')
const lightboxFigure = lightbox.querySelector('figure')
const controller = new AbortController()

console.log('Figures: ', figures)
console.log('Figures length: ', figures.length)

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

// class Flip {
//     /**
//      * @param {HTMLElement} element 
//      */
//     first(element) {
//         this.state = element.getBoundingClientRect()
//     }
//     /**
//      * @param {HTMLElement} element 
//      */
//     invert(element) {
//         const first = this.state
//         const last = element.getBoundingClientRect()

//         let delta = {
//             x: -1 * (last.left - first.left),
//             y: -1 * (last.top - first.top),
//             // x: last.left - first.left,
//             // y: last.top - first.top,
//             scaleX: first.width / last.width,
//             scaleY: first.height / last.height
//         }
//         console.log('[flip] invert delta:', delta)

//         element.style.transform = `
//             translate(${delta.x}px, ${delta.y}px)
//             scale(${delta.scaleX}, ${delta.scaleY})`
//     }
//     /**
//      * @param {HTMLElement} element 
//      */
//     play(element) {
//         requestAnimationFrame(() => {
//             element.classList.add('animate')
//             element.style.transform = 'none'
//         })
//     }
// }

// const flip = new Flip()

/**
 * @param {MouseEvent & { target: HTMLImageElement }} event
 * @param {Number} key
 */
function handleImgClick({ target }, key) {
    const figure = target.parentNode
    const figcaption = figure.querySelector('figcaption')
    const imgState = window.Flip.getState(target)
    const figcaptionState = window.Flip.getState(figcaption)

    const imgClone = target.cloneNode()
    const figcaptionClone = figcaption.cloneNode(true)

    // const removeClass = 'w-full md:max-w-3xl md:max-h-96 object-cover rounded-lg'.split(' ')
    // target.classList.remove(...removeClass)
    // const addClass = 'w-full md:max-w-3xl md:max-h-96 object-cover rounded-lg'.split(' ')
    // target.classList.add(...addClass)

    lightboxFigure.appendChild(target)
    lightboxFigure.appendChild(figcaption)
    figure.append(imgClone)
    figure.append(figcaptionClone)
    // figures.forEach(())
    figures = document.querySelectorAll('figure.article-image')
    openLightbox(target.src, figcaption.textContent, key)

    window.Flip.from(imgState, {
        duration: .25,
        ease: "sine.in",
        scale: true,
        // onComplete: () => animateLighbox(),
        // absolute: true,
    })
    window.Flip.from(figcaptionState, {
        duration: .25,
        ease: "sine.in",
        onComplete: () => controller.abort()
    })
}

function attachImgClickListeners(figures) {
    figures.forEach(
        /**
         * 
         * @param {HTMLElement} figure 
         * @param {Number} key 
         */
        (figure, key) => {
        const img = figure.querySelector('img')

        // console.log("Figure key: ", key)

        img.addEventListener('click', (event, key) => handleImgClick(event, key), { signal: controller.signal })
        img.classList.add('cursor-pointer')
        // img.addEventListener("transitionend", /** @param {TransitionEvent & { target: HTMLImageElement }} */ ({ target }) => {
        //     target.classList.remove('animate')
        // })
    })
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

let initialX = null
let initialY = null

function openLightbox(src, caption, key) {
    // lightbox.querySelector('img').src = src
    // lightbox.querySelector('figcaption').textContent = caption
    lightbox.dataset.current = key
    lightbox.classList.add('lightbox-fade-in')
    lightbox.style.display = 'block'
    disableScroll()
}

function closeLightbox() {
    document.querySelector('.lightbox').style.display = 'none'
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
}

function moveTouch(event) {
    if (initialX === null) {
        return;
    }

    if (initialY === null) {
        return;
    }

    const currentX = event.touches[0].clientX
    const currentY = event.touches[0].clientY

    const diffX = initialX - currentX
    const diffY = initialY - currentY

    if (Math.abs(diffX) > Math.abs(diffY)) {
        // sliding horizontally
        if (diffX > 0) {
            // swiped left
            console.log("swiped left")
            previousLightbox()
        } else {
            // swiped right
            console.log("swiped right")
            nextLightbox()
        }  
    } else {
        // sliding vertically
        if (diffY > 0) {
            // swiped up
            console.log("swiped up")
            previousLightbox()
        } else {
            // swiped down
            console.log("swiped down")
            nextLightbox()
        }  
    }

    initialX = null
    initialY = null

    event.preventDefault();
}

function disableScroll() {
    document.body.style.overflow = 'hidden'
}

function enableScroll() {
    document.body.style.overflow = 'auto'
}

attachImgClickListeners(figures)
