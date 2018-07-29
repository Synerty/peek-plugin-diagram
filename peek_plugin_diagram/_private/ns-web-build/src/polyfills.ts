/**
 * This file includes polyfills needed by Angular and is loaded before the app.
 * You can add your own extra polyfills to this file.
 *
 * This file is divided into 2 sections:
 *   1. Browser polyfills. These are applied before loading ZoneJS and are sorted by browsers.
 *   2. Application imports. Files imported after ZoneJS that should be loaded before your main
 *      file.
 *
 * The current setup is for so-called "evergreen" browsers; the last versions of browsers that
 * automatically update themselves. This includes Safari >= 10, Chrome >= 55 (including Opera),
 * Edge >= 13 on the desktop, and iOS 10 and Chrome on mobile.
 *
 * Learn more in https://angular.io/docs/ts/latest/guide/browser-support.html
 */

/***************************************************************************************************
 * BROWSER POLYFILLS
 */

/** IE9, IE10 and IE11 requires all of the following polyfills. **/
// import 'core-js/es6/symbol';
// import 'core-js/es6/object';
// import 'core-js/es6/function';
// import 'core-js/es6/parse-int';
// import 'core-js/es6/parse-float';
// import 'core-js/es6/number';
// import 'core-js/es6/math';
// import 'core-js/es6/string';
// import 'core-js/es6/date';
// import 'core-js/es6/array';
// import 'core-js/es6/regexp';
// import 'core-js/es6/map';
// import 'core-js/es6/weak-map';
// import 'core-js/es6/set';

/** IE10 and IE11 requires the following for NgClass support on SVG elements */
// import 'classlist.js';  // Run `npm install --save classlist.js`.

/** IE10 and IE11 requires the following to support `@angular/animation`. */
// import 'web-animations-js';  // Run `npm install --save web-animations-js`.


/** Evergreen browsers require these. **/
import 'core-js/es6/reflect';
import 'core-js/es7/reflect';


/** ALL Firefox browsers require the following to support `@angular/animation`. **/
// import 'web-animations-js';  // Run `npm install --save web-animations-js`.



/***************************************************************************************************
 * Zone JS is required by Angular itself.
 */
import 'zone.js/dist/zone';  // Included with Angular CLI.


import 'rxjs/add/observable/interval';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/takeUntil';
import 'rxjs/add/operator/first';
import 'rxjs/add/operator/map';


/***************************************************************************************************
 * APPLICATION IMPORTS
 */

/**
 * Date, currency, decimal and percent pipes.
 * Needed for: All but Chrome, Firefox, Edge, IE11 and Safari 10
 */
// import 'intl';  // Run `npm install --save intl`.
/**
 * Need to import at least one locale-data with intl.
 */
// import 'intl/locale-data/jsonp/en';


/***************************************************************************************************
 * PEEK Polyfill, for NativeScript <webview> on Android
 */

//
// // ----------------------------------------------------------------------------
// if (typeof Object.assign != 'function') {
//   // Must be writable: true, enumerable: false, configurable: true
//   Object.defineProperty(Object, "assign", {
//     value: function assign(target, varArgs) { // .length of function is 2
//       'use strict';
//       if (target == null) { // TypeError if undefined or null
//         throw new TypeError('Cannot convert undefined or null to object');
//       }
//
//       var to = Object(target);
//
//       for (var index = 1; index < arguments.length; index++) {
//         var nextSource = arguments[index];
//
//         if (nextSource != null) { // Skip over if undefined or null
//           for (var nextKey in nextSource) {
//             // Avoid bugs when hasOwnProperty is shadowed
//             if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
//               to[nextKey] = nextSource[nextKey];
//             }
//           }
//         }
//       }
//       return to;
//     },
//     writable: true,
//     configurable: true
//   });
// }
//
//
//
// // ----------------------------------------------------------------------------
//
// // Production steps of ECMA-262, Edition 6, 22.1.2.1
// if (!Array.from) {
//   Array.from = (function () {
//     var toStr = Object.prototype.toString;
//     var isCallable = function (fn) {
//       return typeof fn === 'function' || toStr.call(fn) === '[object Function]';
//     };
//     var toInteger = function (value) {
//       var number = Number(value);
//       if (isNaN(number)) { return 0; }
//       if (number === 0 || !isFinite(number)) { return number; }
//       return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
//     };
//     var maxSafeInteger = Math.pow(2, 53) - 1;
//     var toLength = function (value) {
//       var len = toInteger(value);
//       return Math.min(Math.max(len, 0), maxSafeInteger);
//     };
//
//     // The length property of the from method is 1.
//     return function from(arrayLike/*, mapFn, thisArg */) {
//       // 1. Let C be the this value.
//       var C = this;
//
//       // 2. Let items be ToObject(arrayLike).
//       var items = Object(arrayLike);
//
//       // 3. ReturnIfAbrupt(items).
//       if (arrayLike == null) {
//         throw new TypeError('Array.from requires an array-like object - not null or undefined');
//       }
//
//       // 4. If mapfn is undefined, then let mapping be false.
//       var mapFn = arguments.length > 1 ? arguments[1] : void undefined;
//       var T;
//       if (typeof mapFn !== 'undefined') {
//         // 5. else
//         // 5. a If IsCallable(mapfn) is false, throw a TypeError exception.
//         if (!isCallable(mapFn)) {
//           throw new TypeError('Array.from: when provided, the second argument must be a function');
//         }
//
//         // 5. b. If thisArg was supplied, let T be thisArg; else let T be undefined.
//         if (arguments.length > 2) {
//           T = arguments[2];
//         }
//       }
//
//       // 10. Let lenValue be Get(items, "length").
//       // 11. Let len be ToLength(lenValue).
//       var len = toLength(items.length);
//
//       // 13. If IsConstructor(C) is true, then
//       // 13. a. Let A be the result of calling the [[Construct]] internal method
//       // of C with an argument list containing the single item len.
//       // 14. a. Else, Let A be ArrayCreate(len).
//       var A = isCallable(C) ? Object(new C(len)) : new Array(len);
//
//       // 16. Let k be 0.
//       var k = 0;
//       // 17. Repeat, while k < len… (also steps a - h)
//       var kValue;
//       while (k < len) {
//         kValue = items[k];
//         if (mapFn) {
//           A[k] = typeof T === 'undefined' ? mapFn(kValue, k) : mapFn.call(T, kValue, k);
//         } else {
//           A[k] = kValue;
//         }
//         k += 1;
//       }
//       // 18. Let putStatus be Put(A, "length", len, true).
//       A.length = len;
//       // 20. Return A.
//       return A;
//     };
//   }());
// }
