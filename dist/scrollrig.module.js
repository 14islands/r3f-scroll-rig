import e,{useLayoutEffect as n,useEffect as r,forwardRef as t,useRef as o,useImperativeHandle as i,useMemo as l,Fragment as a,cloneElement as c,Component as u,startTransition as s,useState as d,useCallback as f}from"react";import{useThree as v,invalidate as p,useFrame as h,Canvas as m,createPortal as g,useLoader as w,addEffect as b}from"@react-three/fiber";import{ResizeObserver as y}from"@juggle/resize-observer";import{parse as S}from"query-string";import R from"zustand";import{Vector2 as E,Color as C,Scene as O,MathUtils as T,DefaultLoadingManager as I,TextureLoader as L,ImageBitmapLoader as M,Texture as _,CanvasTexture as k}from"three";import{useInView as P}from"react-intersection-observer";import x from"debounce";import V from"vecn";import{suspend as D}from"suspend-react";import j from"supports-webp";import A from"fast-deep-equal";import U from"lenis";function z(){return z=Object.assign?Object.assign.bind():function(e){for(var n=1;n<arguments.length;n++){var r=arguments[n];for(var t in r)Object.prototype.hasOwnProperty.call(r,t)&&(e[t]=r[t])}return e},z.apply(this,arguments)}function Y(e,n){return Y=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(e,n){return e.__proto__=n,e},Y(e,n)}function F(e,n){if(null==e)return{};var r,t,o={},i=Object.keys(e);for(t=0;t<i.length;t++)n.indexOf(r=i[t])>=0||(o[r]=e[r]);return o}function Q(e){var n=function(e,n){if("object"!=typeof e||null===e)return e;var r=e[Symbol.toPrimitive];if(void 0!==r){var t=r.call(e,"string");if("object"!=typeof t)return t;throw new TypeError("@@toPrimitive must return a primitive value.")}return String(e)}(e);return"symbol"==typeof n?n:String(n)}var q="undefined"!=typeof window?n:r,B={PRIORITY_PRELOAD:0,PRIORITY_SCISSORS:1,PRIORITY_VIEWPORTS:1,PRIORITY_GLOBAL:1e3,DEFAULT_SCALE_MULTIPLIER:1,preloadQueue:[]},W=R(function(e){return{debug:!1,scaleMultiplier:B.DEFAULT_SCALE_MULTIPLIER,globalRender:!0,globalPriority:B.PRIORITY_GLOBAL,globalClearDepth:!1,globalRenderQueue:!1,clearGlobalRenderQueue:function(){return e(function(){return{globalRenderQueue:!1}})},isCanvasAvailable:!1,hasSmoothScrollbar:!1,canvasChildren:{},renderToCanvas:function(n,r,t){return void 0===t&&(t={}),e(function(e){var o,i=e.canvasChildren;return Object.getOwnPropertyDescriptor(i,n)?(i[n].instances+=1,i[n].props.inactive=!1,{canvasChildren:i}):{canvasChildren:z({},i,((o={})[n]={mesh:r,props:t,instances:1},o))}})},updateCanvas:function(n,r){return e(function(e){var t,o=e.canvasChildren;if(o[n]){var i=o[n],l=i.instances;return{canvasChildren:z({},o,((t={})[n]={mesh:i.mesh,props:z({},i.props,r),instances:l},t))}}})},removeFromCanvas:function(n,r){return void 0===r&&(r=!0),e(function(e){var t,o=e.canvasChildren;return(null==(t=o[n])?void 0:t.instances)>1?(o[n].instances-=1,{canvasChildren:o}):r?{canvasChildren:F(o,[n].map(Q))}:(o[n].instances=0,o[n].props.inactive=!0,{canvasChildren:z({},o)})})},pageReflow:0,requestReflow:function(){e(function(e){return{pageReflow:e.pageReflow+1}})},scroll:{y:0,x:0,limit:0,velocity:0,progress:0,direction:0,scrollDirection:void 0},__lenis:void 0,scrollTo:function(){},onScroll:function(){return function(){}}}}),G=function(){var e=W(function(e){return e.requestReflow}),n=W(function(e){return e.debug});return r(function(){var r=new(window.ResizeObserver||y)(function(){e(),n&&console.log("ResizeManager","document.body height changed")});return r.observe(document.body),function(){null==r||r.disconnect()}},[]),null},H=["makeDefault","margin"],X=t(function(n,r){var t=n.makeDefault,a=void 0!==t&&t,c=n.margin,u=void 0===c?0:c,s=F(n,H),d=v(function(e){return e.set}),f=v(function(e){return e.camera}),p=v(function(e){return e.size}),h=v(function(e){return e.viewport}),m=o(null);i(r,function(){return m.current});var g=W(function(e){return e.pageReflow}),w=W(function(e){return e.scaleMultiplier}),b=l(function(){var e,n=(p.height+2*u)*w,r=(p.width+2*u)*w/n,t=s.fov||50,o=null==s||null==(e=s.position)?void 0:e[2];return o?t=180/Math.PI*2*Math.atan(n/(2*o)):o=n/(2*Math.tan(t/2*Math.PI/180)),{fov:t,distance:o,aspect:r}},[p,w,g]),y=b.fov,S=b.distance,R=b.aspect;return q(function(){m.current.lookAt(0,0,0),m.current.updateProjectionMatrix(),m.current.updateMatrixWorld(),d(function(e){return{viewport:z({},e.viewport,h.getCurrentViewport(f))}})},[p,w,g]),q(function(){if(a){var e=f;return d(function(){return{camera:m.current}}),function(){return d(function(){return{camera:e}})}}},[m,a,d]),e.createElement("perspectiveCamera",z({ref:m,position:[0,0,S],onUpdate:function(e){return e.updateProjectionMatrix()},near:.1,aspect:R,fov:y,far:2*S},s))}),N=["makeDefault","margin"],J=t(function(n,r){var t=n.makeDefault,a=void 0!==t&&t,c=n.margin,u=void 0===c?0:c,s=F(n,N),d=v(function(e){return e.set}),f=v(function(e){return e.camera}),p=v(function(e){return e.size}),h=W(function(e){return e.pageReflow}),m=W(function(e){return e.scaleMultiplier}),g=l(function(){return Math.max(p.width*m,p.height*m)},[p,h,m]),w=o(null);return i(r,function(){return w.current}),q(function(){w.current.lookAt(0,0,0),w.current.updateProjectionMatrix(),w.current.updateMatrixWorld()},[g,p]),q(function(){if(a){var e=f;return d(function(){return{camera:w.current}}),function(){return d(function(){return{camera:e}})}}},[w,a,d]),e.createElement("orthographicCamera",z({left:p.width*m/-2-u*m,right:p.width*m/2+u*m,top:p.height*m/2+u*m,bottom:p.height*m/-2-u*m,far:2*g,position:[0,0,g],near:.001,ref:w,onUpdate:function(e){return e.updateProjectionMatrix()}},s))});function K(e,n){e&&(!1===n?(e.wasFrustumCulled=e.frustumCulled,e.wasVisible=e.visible,e.visible=!0,e.frustumCulled=!1):(e.visible=!!e.wasVisible,e.frustumCulled=!!e.wasFrustumCulled),e.children.forEach(function(e){return K(e,n)}))}var Z,$=new E,ee=function(e){void 0===e&&(e=[0]),W.getState().globalRenderQueue=W.getState().globalRenderQueue||[0],W.getState().globalRenderQueue=[].concat(W.getState().globalRenderQueue||[],e)},ne=function(e){var n=e.gl,r=e.scene,t=e.camera,o=e.left,i=e.top,l=e.width,a=e.height,c=e.layer,u=void 0===c?0:c,s=e.autoClear,d=e.clearDepth,f=void 0!==d&&d;r&&t&&(n.autoClear=void 0!==s&&s,n.setScissor(o,i,l,a),n.setScissorTest(!0),t.layers.set(u),f&&n.clearDepth(),n.render(r,t),n.setScissorTest(!1))},re=function(e){var n=e.gl,r=e.scene,t=e.camera,o=e.left,i=e.top,l=e.width,a=e.height,c=e.layer,u=void 0===c?0:c,s=e.scissor,d=void 0===s||s,f=e.autoClear,v=void 0!==f&&f,p=e.clearDepth,h=void 0!==p&&p;r&&t&&(n.getSize($),n.autoClear=v,n.setViewport(o,i,l,a),n.setScissor(o,i,l,a),n.setScissorTest(d),t.layers.set(u),h&&n.clearDepth(),n.render(r,t),n.setScissorTest(!1),n.setViewport(0,0,$.x,$.y))},te=function(e,n){var r=e.scene,t=e.camera,o=e.layer,i=void 0===o?0:o;B.preloadQueue.push(function(e,o,l){e.setScissorTest(!1),K(r||o,!1),(t||l).layers.set(i),e.render(r||o,t||l),K(r||o,!0),n&&n()}),p()},oe=function(){var e=W(function(e){return e.isCanvasAvailable}),n=W(function(e){return e.hasSmoothScrollbar}),t=W(function(e){return e.requestReflow}),o=W(function(e){return e.pageReflow}),i=W(function(e){return e.debug}),l=W(function(e){return e.scaleMultiplier});return r(function(){i&&(window._scrollRig=window._scrollRig||{},window._scrollRig.reflow=t)},[]),{debug:i,isCanvasAvailable:e,hasSmoothScrollbar:n,scaleMultiplier:l,preloadScene:te,requestRender:ee,renderScissor:ne,renderViewport:re,reflow:t,reflowCompleted:o}},ie=function(n){var t=n.children,o=v(function(e){return e.gl}),i=W(function(e){return e.canvasChildren}),l=oe();return r(function(){Object.keys(i).length||(l.debug&&console.log("GlobalRenderer","auto render empty canvas"),o.clear(),l.requestRender(),p())},[i]),l.debug&&console.log("GlobalChildren",Object.keys(i).length),e.createElement(e.Fragment,null,t,Object.keys(i).map(function(n){var r=i[n],t=r.mesh,o=r.props;return"function"==typeof t?e.createElement(a,{key:n},t(z({key:n},l,o))):c(t,z({key:n},o))}))},le=function(){var e=v(function(e){return e.gl}),n=v(function(e){return e.frameloop}),r=W(function(e){return e.globalClearDepth}),t=W(function(e){return e.globalPriority}),o=oe();return q(function(){e.debug.checkShaderErrors=o.debug},[o.debug]),h(function(n){var r=n.camera,t=n.scene;B.preloadQueue.length&&(B.preloadQueue.forEach(function(n){return n(e,t,r)}),e.clear(),B.preloadQueue=[],o.debug&&console.log("GlobalRenderer","preload complete. trigger global render"),o.requestRender(),p())},B.PRIORITY_PRELOAD),h(function(t){var o=t.camera,i=t.scene,l=W.getState().globalRenderQueue;("always"===n||l)&&(o.layers.disableAll(),l?l.forEach(function(e){o.layers.enable(e)}):o.layers.enable(0),r&&e.clearDepth(),e.render(i,o)),W.getState().clearGlobalRenderQueue()},t),null},ae=/*#__PURE__*/function(e){var n,r;function t(n){var r;return(r=e.call(this,n)||this).state={error:!1},r.props=n,r}return r=e,(n=t).prototype=Object.create(r.prototype),n.prototype.constructor=n,Y(n,r),t.getDerivedStateFromError=function(e){return{error:e}},t.prototype.render=function(){return this.state.error?(this.props.onError&&this.props.onError(this.state.error),null):this.props.children},t}(u),ce="8.13.2",ue=["children","as","gl","style","orthographic","camera","debug","scaleMultiplier","globalRender","globalPriority","globalClearDepth"],se=["children","onError"];"undefined"!=typeof window&&(Z=window.ResizeObserver||y);var de=function(n){var r=n.children,t=n.as,o=void 0===t?m:t,i=n.gl,l=n.style,a=n.orthographic,c=n.camera,u=n.debug,d=n.scaleMultiplier,f=void 0===d?B.DEFAULT_SCALE_MULTIPLIER:d,v=n.globalRender,p=void 0===v||v,h=n.globalPriority,g=void 0===h?B.PRIORITY_GLOBAL:h,w=n.globalClearDepth,b=void 0!==w&&w,y=F(n,ue),R=W(function(e){return e.globalRender});return q(function(){"undefined"!=typeof window&&(window.__r3f_scroll_rig=ce);var e=S(window.location.search);(u||void 0!==e.debug)&&(W.setState({debug:!0}),console.info("@14islands/r3f-scroll-rig@"+ce))},[u]),q(function(){s(function(){W.setState({scaleMultiplier:f,globalRender:p,globalPriority:g,globalClearDepth:b})})},[f,g,p,b]),e.createElement(o,z({id:"ScrollRig-canvas",camera:{manual:!0},gl:z({failIfMajorPerformanceCaveat:!0},i),resize:{scroll:!1,debounce:0,polyfill:Z},style:z({position:"fixed",top:0,left:0,right:0,height:"100vh"},l)},y),!a&&e.createElement(X,z({manual:!0,makeDefault:!0},c)),a&&e.createElement(J,z({manual:!0,makeDefault:!0},c)),R&&e.createElement(le,null),"function"==typeof r?r(e.createElement(ie,null)):e.createElement(ie,null,r),e.createElement(G,null))},fe=function(n){var r=n.children,t=n.onError,o=F(n,se);return q(function(){document.documentElement.classList.add("js-has-global-canvas"),W.setState({isCanvasAvailable:!0})},[]),e.createElement(ae,{onError:function(e){t&&t(e),W.setState({isCanvasAvailable:!1}),document.documentElement.classList.remove("js-has-global-canvas"),document.documentElement.classList.add("js-global-canvas-error")}},e.createElement(de,z({},o),r),e.createElement("noscript",null,e.createElement("style",null,"\n          .ScrollRig-visibilityHidden,\n          .ScrollRig-transparentColor {\n            visibility: unset;\n            color: unset;\n          }\n          ")))},ve=function(n){return e.createElement("mesh",{scale:n.scale},e.createElement("planeGeometry",null),e.createElement("shaderMaterial",{args:[{uniforms:{color:{value:new C("hotpink")}},vertexShader:"\n            void main() {\n              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n            }\n          ",fragmentShader:"\n            uniform vec3 color;\n            uniform float opacity;\n            void main() {\n              gl_FragColor.rgba = vec4(color, .5);\n            }\n          "}],transparent:!0}))},pe="undefined"!=typeof window;function he(e){var n=(void 0===e?{}:e).debounce,t=void 0===n?0:n,o=d({width:pe?window.innerWidth:Infinity,height:pe?window.innerHeight:Infinity}),i=o[0],l=o[1];return r(function(){var e=document.getElementById("ScrollRig-canvas");function n(){var n=e?e.clientWidth:window.innerWidth,r=e?e.clientHeight:window.innerHeight;n===i.width&&r===i.height||l({width:n,height:r})}var r,o=x.debounce(n,t),a=window.ResizeObserver||y;return e?(r=new a(o)).observe(e):window.addEventListener("resize",o),n(),function(){var e;window.removeEventListener("resize",o),null==(e=r)||e.disconnect()}},[i,l]),i}function me(e,n,r,t,o){return t+(e-n)*(o-t)/(r-n)}var ge=function(){return{enabled:W(function(e){return e.hasSmoothScrollbar}),scroll:W(function(e){return e.scroll}),scrollTo:W(function(e){return e.scrollTo}),onScroll:W(function(e){return e.onScroll}),__lenis:W(function(e){return e.__lenis})}};function we(e,n){var t=he(),i=ge(),a=i.scroll,c=i.onScroll,u=W(function(e){return e.scaleMultiplier}),s=W(function(e){return e.pageReflow}),v=W(function(e){return e.debug}),p=l(function(){var e={rootMargin:"0%",threshold:0,autoUpdate:!0},r=n||{};return Object.keys(r).map(function(n,t){void 0!==r[n]&&(e[n]=r[n])}),e},[n]),h=p.autoUpdate,m=p.wrapper,g=P({rootMargin:p.rootMargin,threshold:p.threshold}),w=g.ref,b=g.inView;q(function(){w(e.current)},[e,null==e?void 0:e.current]);var y=d(V.vec3(0,0,0)),S=y[0],R=y[1],E=o({inViewport:!1,progress:-1,visibility:-1,viewport:-1}).current,C=o({top:0,bottom:0,left:0,right:0,width:0,height:0}).current,O=d(C),T=O[0],I=O[1],L=o({top:0,bottom:0,left:0,right:0,width:0,height:0,x:0,y:0,positiveYUpBottom:0}).current,M=o(V.vec3(0,0,0)).current;q(function(){var n,r=null==(n=e.current)?void 0:n.getBoundingClientRect();if(r){var o=m?m.scrollTop:window.scrollY,i=m?m.scrollLeft:window.scrollX;C.top=r.top+o,C.bottom=r.bottom+o,C.left=r.left+i,C.right=r.right+i,C.width=r.width,C.height=r.height,I(z({},C)),R(V.vec3((null==C?void 0:C.width)*u,(null==C?void 0:C.height)*u,1)),v&&console.log("useTracker.getBoundingClientRect:",C,"intialScroll:",{initialY:o,initialX:i},"size:",t,"pageReflow:",s)}},[e,t,s,u,v]);var _=f(function(n){var r=void 0===n?{}:n,o=r.onlyUpdateInViewport;if(e.current&&(void 0===o||!o||E.inViewport)){var i=r.scroll||a;!function(e,n,r,t){e.top=n.top-(r.y||0),e.bottom=n.bottom-(r.y||0),e.left=n.left-(r.x||0),e.right=n.right-(r.x||0),e.width=n.width,e.height=n.height,e.x=e.left+.5*n.width-.5*t.width,e.y=e.top+.5*n.height-.5*t.height,e.positiveYUpBottom=t.height-e.bottom}(L,C,i,t),function(e,n,r){e.x=n.x*r,e.y=-1*n.y*r}(M,L,u);var l="horizontal"===i.scrollDirection,c=l?"width":"height",s=t[c]-L[l?"left":"top"];E.progress=me(s,0,t[c]+L[c],0,1),E.visibility=me(s,0,L[c],0,1),E.viewport=me(s,0,t[c],0,1)}},[e,t,u,a]);return q(function(){E.inViewport=b,_({onlyUpdateInViewport:!1}),v&&console.log("useTracker.inViewport:",b,"update()")},[b]),q(function(){_({onlyUpdateInViewport:!1}),v&&console.log("useTracker.update on resize/reflow")},[_,s]),r(function(){if(h)return c(function(e){return _({onlyUpdateInViewport:!0})})},[h,_,c]),{scale:S,inViewport:b,rect:T,bounds:L,position:M,scrollState:E,update:_}}var be=["track","children","margin","inViewportMargin","inViewportThreshold","visible","hideOffscreen","scissor","debug","as","priority","scene"];function ye(n){var t=n.track,i=n.children,l=n.margin,a=void 0===l?0:l,c=n.inViewportMargin,u=n.inViewportThreshold,s=n.visible,f=void 0===s||s,p=n.hideOffscreen,m=void 0===p||p,w=n.scissor,b=void 0!==w&&w,y=n.debug,S=void 0!==y&&y,R=n.as,E=void 0===R?"scene":R,C=n.priority,T=void 0===C?B.PRIORITY_SCISSORS:C,I=n.scene,L=F(n,be),M=v(function(e){return e.scene}),_=o(),k=d(I||(b?new O:null))[0],P=oe(),x=P.requestRender,V=P.renderScissor,D=W(function(e){return e.globalRender}),j=we(t,{rootMargin:c,threshold:u}),A=j.bounds,U=j.scale,Y=j.position,Q=j.scrollState,G=j.inViewport;q(function(){_.current&&(_.current.visible=m?G&&f:f)},[G,m,f]),r(function(){_.current&&(_.current.position.y=Y.y,_.current.position.x=Y.x)},[U,G]),h(function(e){var n=e.gl,r=e.camera;_.current&&_.current.visible&&(_.current.position.y=Y.y,_.current.position.x=Y.x,b?V({gl:n,portalScene:k,camera:r,left:A.left-a,top:A.positiveYUpBottom-a,width:A.width+2*a,height:A.height+2*a}):x())},D?T:void 0);var H=e.createElement(E,{ref:_},(!i||S)&&U&&e.createElement(ve,{scale:U}),i&&U&&i(z({track:t,margin:a,scene:k||M,scale:U,scrollState:Q,inViewport:G,priority:T},L)));return k?g(H,k):H}var Se=["track","children","margin","visible","hideOffscreen","debug","orthographic","priority","inViewport","bounds","scale","scrollState","camera","hud","position","rect"],Re=["track","margin","inViewportMargin","inViewportThreshold","priority"],Ee=["bounds"],Ce=function(n){var t=n.track,o=n.children,i=n.margin,l=void 0===i?0:i,a=n.visible,c=void 0===a||a,u=n.hideOffscreen,s=void 0===u||u,d=n.debug,f=void 0!==d&&d,p=n.orthographic,m=void 0!==p&&p,g=n.priority,w=void 0===g?B.PRIORITY_VIEWPORTS:g,b=n.inViewport,y=n.bounds,S=n.scale,R=n.scrollState,E=n.camera,C=n.hud,O=F(n,Se),T=v(function(e){return e.scene}),I=v(function(e){return e.get}),L=v(function(e){return e.setEvents}),M=oe().renderViewport;return q(function(){T.visible=s?b&&c:c},[b,s,c]),r(function(){var e=I().events.connected;return L({connected:t.current}),function(){return L({connected:e})}},[]),h(function(e){var n=e.scene;n.visible&&M({gl:e.gl,scene:n,camera:e.camera,left:y.left-l,top:y.positiveYUpBottom-l,width:y.width+2*l,height:y.height+2*l,clearDepth:!!C})},w),e.createElement(e.Fragment,null,!m&&e.createElement(X,z({manual:!0,margin:l,makeDefault:!0},E)),m&&e.createElement(J,z({manual:!0,margin:l,makeDefault:!0},E)),(!o||f)&&S&&e.createElement(ve,{scale:S}),o&&S&&o(z({track:t,margin:l,scale:S,scrollState:R,inViewport:b,priority:w},O)))};function Oe(n){var r=n.track,t=n.margin,o=void 0===t?0:t,i=n.inViewportMargin,l=n.inViewportThreshold,a=n.priority,c=F(n,Re),u=d(function(){return new O})[0],s=we(r,{rootMargin:i,threshold:l}),v=s.bounds,p=F(s,Ee),h=f(function(e,n){r.current&&e.target===r.current&&(n.pointer.set((e.clientX-v.left+o)/(v.width+2*o)*2-1,-(e.clientY-v.top+o)/(v.height+2*o)*2+1),n.raycaster.setFromCamera(n.pointer,n.camera))},[v]);return v&&g(e.createElement(Ce,z({track:r,bounds:v,priority:a,margin:o},c,p)),u,{events:{compute:h,priority:a},size:{width:v.width,height:v.height}})}function Te(e,n,t){void 0===n&&(n={});var o=void 0===t?{}:t,i=o.key,a=o.dispose,c=void 0===a||a,u=W(function(e){return e.updateCanvas}),s=W(function(e){return e.renderToCanvas}),d=W(function(e){return e.removeFromCanvas}),v=l(function(){return i||T.generateUUID()},[]);q(function(){s(v,e,z({},n,{inactive:!1}))},[v]),r(function(){return function(){d(v,c)}},[v]);var p=f(function(e){u(v,e)},[u,v]);return r(function(){p(n)},[].concat(Object.values(n))),p}var Ie=["children","id","dispose"],Le=t(function(e,n){var r=e.children,t=e.id,o=e.dispose,i=void 0===o||o,l=F(e,Ie);return r?(Te(r,z({},l,{id:t,ref:n}),{key:t,dispose:i}),null):null}),Me=!1;function _e(e,n){var t,o,i=void 0===n?{}:n,a=i.initTexture,c=void 0===a||a,u=i.premultiplyAlpha,s=void 0===u?"default":u,f=v(function(e){return e.gl}),p=he(),h=W(function(e){return e.debug}),m=d(null==(t=e.current)?void 0:t.currentSrc),g=m[0],b=m[1];r(function(){var n=e.current,r=function(){var n;b(null==(n=e.current)?void 0:n.currentSrc)};return null==n||n.addEventListener("load",r),function(){return null==n?void 0:n.removeEventListener("load",r)}},[e,g,b]);var y,S,R,E=D(function(){return I.itemStart("waiting for DOM image"),new Promise(function(n){var r=e.current;function t(){n(null==r?void 0:r.currentSrc),I.itemEnd("waiting for DOM image")}null==r||r.addEventListener("load",t,{once:!0}),null!=r&&r.complete&&(null==r||r.removeEventListener("load",t),t())})},[e,p,null==(o=e.current)?void 0:o.currentSrc,g],{equal:A}),C=(y=!0===/^((?!chrome|android).)*safari/i.test(navigator.userAgent),R=(S=navigator.userAgent.indexOf("Firefox")>-1)?navigator.userAgent.match(/Firefox\/([0-9]+)\./)[1]:-1,"undefined"==typeof createImageBitmap||y||S&&Number(R)<98?L:M),O=w(C,E,function(e){e instanceof M&&(e.setOptions({colorSpaceConversion:"none",premultiplyAlpha:s,imageOrientation:"flipY"}),e.setRequestHeader({Accept:(Me?"image/webp,":"")+"*/*"}))}),T=l(function(){return O instanceof _?O:O instanceof ImageBitmap?new k(O):void 0},[O]);return r(function(){c&&f.initTexture(T),h&&console.log("useImageAsTexture","initTexture()")},[f,T,c]),T}j.then(function(e){Me=e});var ke=t(function(e,n){var t=e.children,l=e.enabled,a=void 0===l||l,c=e.locked,u=void 0!==c&&c,s=e.scrollRestoration,d=void 0===s?"auto":s,v=e.disablePointerOnScroll,p=void 0===v||v,h=e.horizontal,m=void 0!==h&&h,g=e.scrollInContainer,w=void 0!==g&&g,b=e.updateGlobalState,y=void 0===b||b,S=e.onScroll,R=e.config,E=void 0===R?{}:R,C=e.invalidate,O=void 0===C?function(){}:C,T=e.addEffect,I=o(),L=o(!1),M=W(function(e){return e.scroll});i(n,function(){return{start:function(){var e;return null==(e=I.current)?void 0:e.start()},stop:function(){var e;return null==(e=I.current)?void 0:e.stop()},on:function(e,n){var r;return null==(r=I.current)?void 0:r.on(e,n)},scrollTo:function(e,n){var r;return null==(r=I.current)?void 0:r.scrollTo(e,n)},raf:function(e){var n;return null==(n=I.current)?void 0:n.raf(e)},__lenis:I.current}});var _=f(function(e){p&&L.current!==e&&(L.current=e,document.documentElement.style.pointerEvents=e?"none":"auto")},[p,L]);return q(function(){"scrollRestoration"in window.history&&(window.history.scrollRestoration=d)},[]),q(function(){var e,n,r=document.documentElement,t=document.body,o=document.body.firstElementChild;return r.classList.toggle("ScrollRig-scrollHtml",w),t.classList.toggle("ScrollRig-scrollWrapper",w),w&&Object.assign(E,{smoothTouch:!0,wrapper:t,content:o}),I.current=new U(z({orientation:m?"horizontal":"vertical"},E,a?{}:{smoothWheel:!1,syncTouch:!1,smoothTouch:!1})),T?e=T(function(e){var n;return null==(n=I.current)?void 0:n.raf(e)}):(n=requestAnimationFrame(function e(r){var t;null==(t=I.current)||t.raf(r),n=requestAnimationFrame(e)}),e=function(){return cancelAnimationFrame(n)}),function(){var n;e(),null==(n=I.current)||n.destroy()}},[a]),q(function(){var e=I.current,n=function(e){var n=e.scroll,r=e.limit,t=e.velocity,o=e.direction,i=e.progress,l=m?n:0;y&&(M.y=m?0:n,M.x=l,M.limit=r,M.velocity=t,M.direction=o,M.progress=i||0),Math.abs(t)>1.5&&_(!0),Math.abs(t)<1&&_(!1),S&&S({scroll:n,limit:r,velocity:t,direction:o,progress:i}),O()};return null==e||e.on("scroll",n),y&&(M.scrollDirection=m?"horizontal":"vertical",W.setState({__lenis:e,scrollTo:function(){null==e||e.scrollTo.apply(e,[].slice.call(arguments))},onScroll:function(n){return null==e||e.on("scroll",n),null==e||e.emit(),function(){return null==e?void 0:e.off("scroll",n)}}}),W.getState().scroll.y=window.scrollY,W.getState().scroll.x=window.scrollX),null==e||e.emit(),function(){null==e||e.off("scroll",n),y&&W.setState({__lenis:void 0,onScroll:function(){return function(){}},scrollTo:function(){}})}},[a]),q(function(){var e=function(){return O()},n=function(){return _(!1)};return window.addEventListener("pointermove",n),window.addEventListener("pointerdown",n),window.addEventListener("wheel",e),function(){window.removeEventListener("pointermove",n),window.removeEventListener("pointerdown",n),window.removeEventListener("wheel",e)}},[]),r(function(){return y&&(document.documentElement.classList.toggle("js-smooth-scrollbar-enabled",a),document.documentElement.classList.toggle("js-smooth-scrollbar-disabled",!a),W.setState({hasSmoothScrollbar:a})),function(){document.documentElement.classList.remove("js-smooth-scrollbar-enabled"),document.documentElement.classList.remove("js-smooth-scrollbar-disabled")}},[a]),r(function(){var e,n;u?null==(e=I.current)||e.stop():null==(n=I.current)||n.start()},[u]),t?t({}):null}),Pe=t(function(n,r){var t=W(function(e){return e.isCanvasAvailable});return e.createElement(ke,z(t?{key:"r3f",ref:r,invalidate:p,addEffect:b}:{key:"native",ref:r},n))}),xe={hidden:"ScrollRig-visibilityHidden",hiddenWhenSmooth:"ScrollRig-visibilityHidden ScrollRig-hiddenIfSmooth",transparentColor:"ScrollRig-transparentColor",transparentColorWhenSmooth:"ScrollRig-transparentColor ScrollRig-hiddenIfSmooth"};export{fe as GlobalCanvas,ye as ScrollScene,Pe as SmoothScrollbar,Le as UseCanvas,Oe as ViewportScrollScene,xe as styles,Te as useCanvas,W as useCanvasStore,_e as useImageAsTexture,oe as useScrollRig,ge as useScrollbar,we as useTracker};
//# sourceMappingURL=scrollrig.module.js.map
