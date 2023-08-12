/**
 * @callback EasingFunction
 * @param {Number} t
 * @returns {Number}
 */

/**
 * @typedef {{
*      delay?: Number,
*      duration?: Number,
*      easing?: EasingFunction,
*      css?: (t: Number, u: Number) => String,
*      tick?: (t: Number, u: Number) => void
* }} TransitionConfig
*/

/**
* @typedef {{
*      delay?: Number,
*      duration?: Number,
*      easing?: EasingFunction
* }} CrossfadeParams
*/

/**
* @template T
* @template S
* @param {T} tar
* @param {S} src
* @returns {T & S}
*/
function assign(tar, src) {
   for (const k in src) tar[k] = src[k]
   return /** @type {T & S} */ (tar)
}

/**
* https://svelte.dev/docs/svelte-easing
* @param {Number} t
* @returns {Number}
*/
function cubicOut(t) {
   const f = t - 1.0;
   return f * f * f + 1.0;
}

/**
* @param {any} thing
* @returns {thing is Function}
*/
function is_function(thing) {
   return typeof thing === 'function'
}

/**
* @param {CrossfadeParams & {
*      fallback?: (node: Element, params: CrossfadeParams, intro: Boolean) => TransitionConfig
* }}
* @returns {[(node: Element, params: CrossfadeParams & { key: any }) => () => TransitionConfig, (node: any, params: CrossfadeParams & { key: any }) => () => TransitionConfig]}
*/
function crossfade({ fallback, ...defaults }) {
   /** @type {Map<any, Element>} */
   const to_receive = new Map()
   /** @type {Map<any, Element>} */
   const to_send = new Map()

   /**
    * @param {Element} from_node
    * @param {Element} node
    * @param {CrossfadeParams} params
    * @returns {TransitionConfig}
    */
   function crossfade(from_node, node, params) {
       const {
           delay= 0,
           duration = (d) => Math.sqrt(d) * 30,
           easing = cubicOut
       } = assign(assign({}, defaults), params)
       const from = from_node.getBoundingClientRect()
       const to = node.getBoundingClientRect()
       const dx = from.left - to.left
       const dy = from.top - to.top
       const dw = from.width / to.width
       const dh = drom.height / to.height
       const d = Math.sqrt(dx * dx + dy * dy)
       const style = getComputedStyle(node)
       const transform = style.transform === 'none' ? '' : style.transform
       const opacity = +style.opacity

       return {
           delay,
           duration: is_function(duration) ? duration(d) : duration,
           easing,
           css: (t, u) => `
               opacity: ${t * opacity};
               transform-origin: top left;
               transform: ${transform} translate(${u * dx}px, ${u * dy}px) scale(${t + (1 - t) * dw}, ${t + (1 - t) * dh});
           `,
       }
   }

   /**
    * @param {Map<any, Element>} items
    * @param {Map<any, Element>} counterparts
    * @param {Boolean} intro
    * @returns {(node: any, params: CrossfadeParams & { key: any; }) => () => TransitionConfig}
    */
   function transition(items, counterparts, intro) {
       return (node, params) => {
           items.set(params.key, node)
           return () => {
               if (counterparts.has(params.key)) {
                   const other_node = counterparts.get(params.key)
                   counterparts.delete(params.key)
                   return crossfade(other_node, node, params)
               }
               // if the node is disappearing altogether
               // (i.e. wasn't claimed by the other list)
               // then we need to supply an outro
               items.delete(params.key)
               return fallback && fallback(node, params, intro)
           }
       }
   }
   return [transition(to_send, to_receive, false), transition(to_receive, to_send, true)]
}

const [send, receive] = crossfade({
   duration: (d) => Math.sqrt(d * 200),

   fallback(node, params) {
       const style = getComputedStyle(node)
       const transform = style.transform === 'none' ? '' : style.transform

       return {
           duration: 600,
           easing: cubicOut,
           css: (t) => `
               transform: ${transform} scale(${t});
               opacity: ${t}
           `
       }
   }
})

// console.log(send(element, { key: element.id }))
