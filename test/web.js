(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (global){(function (){
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{("undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this).Aontu=e()}}((function(){var e=function(e){var t;return function(n){return t||e(t={exports:{},parent:n},t.exports),t.exports}},t=e((function(e,t){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.Site=t.Lang=void 0;const u=o({}),c=n({}),d=s({}),f=l({}),m=h({}),x=a({}),k=r({}),b=i({}),y=p({});t.Site=class{constructor(e){this.row=-1,this.col=-1,this.url="",this.row=e.row,this.col=e.col,this.url=e.url}};let j=function(e){e.use(ke.Path);let t=(e,t)=>(e.path=[...t||[]],e);e.options({value:{def:{string:{val:e=>t(new y.ScalarTypeVal({peg:String}),e.k.path)},number:{val:e=>t(new y.ScalarTypeVal({peg:Number}),e.k.path)},integer:{val:e=>t(new y.ScalarTypeVal({peg:y.Integer}),e.k.path)},boolean:{val:e=>t(new y.ScalarTypeVal({peg:Boolean}),e.k.path)},nil:{val:e=>t(new m.Nil("literal"),e.k.path)},top:{val:()=>y.TOP}}},map:{merge:(e,n)=>{let r=e,i=n;return(null==r?void 0:r.isVal)&&(null==i?void 0:i.isVal)?r instanceof c.ConjunctVal&&i instanceof c.ConjunctVal||r instanceof c.ConjunctVal?(r.append(i),r):t(new c.ConjunctVal({peg:[r,i]}),e.path):(e.___merge=e.___merge||[],e.___merge.push(n),e)}}});let n={"conjunct-infix":(e,n,r)=>t(new c.ConjunctVal({peg:r}),e.k.path),"disjunct-infix":(e,n,r)=>t(new u.DisjunctVal({peg:r}),e.k.path),"dot-prefix":(e,n,r)=>t(new k.RefVal({peg:r,prefix:!0}),e.k.path),"dot-infix":(e,n,r)=>t(new k.RefVal({peg:r}),e.k.path),"star-prefix":(e,n,r)=>t(new x.PrefVal({peg:r[0]}),e.k.path),"dollar-prefix":(e,n,r)=>r[0]instanceof k.RefVal?(r[0].absolute=!0,r[0]):t(new b.VarVal({peg:r[0]}),e.k.path)};e.use(xe.Expr,{op:{conjunct:{infix:!0,src:"&",left:14e6,right:15e6},disjunct:{infix:!0,src:"|",left:16e6,right:17e6},"dollar-prefix":{src:"$",prefix:!0,right:31e6},"dot-infix":{src:".",infix:!0,left:25e6,right:24e6},"dot-prefix":{src:".",prefix:!0,right:24e6},star:{src:"*",prefix:!0,right:24e6}},evaluate:(e,t,r)=>n[t.name](e,t,r)});let r=e.token["#E&"],i=e.token.CL;e.rule("val",e=>(e.open([{s:[r,i],p:"map",b:2,n:{pk:1},g:"spread"}]).bc((e,n)=>{let r=e.node,i=typeof r;"string"===i?r=t(new y.StringVal({peg:e.node}),e.k.path):"number"===i?r=Number.isInteger(e.node)?t(new y.IntegerVal({peg:e.node}),e.k.path):t(new y.NumberVal({peg:e.node}),e.k.path):"boolean"===i&&(r=t(new y.BooleanVal({peg:e.node}),e.k.path));let l=e.o0;r.row=l.rI,r.col=l.cI,r.url=n.meta.multisource&&n.meta.multisource.path,e.node=r}),e)),e.rule("map",e=>(e.open([{s:[r,i],p:"pair",b:2,g:"spread"}]).bc(e=>{let n=e.node;if(n.___merge){let r={...n};delete r.___merge;let i=new f.MapVal({peg:r});e.node=t(new c.ConjunctVal({peg:[i,...n.___merge]}),e.k.path)}else e.node=t(new f.MapVal({peg:n}),e.k.path)}),e)),e.rule("list",e=>(e.bc(e=>{e.node=t(new d.ListVal({peg:e.node}),e.k.path)}),e)),e.rule("pair",e=>(e.open([{s:[r,i],p:"val",u:{spread:!0},g:"spread"}]).ao(e=>{0<e.d&&e.u.spread&&(e.child.k.path=[...e.k.path,"&"],e.child.k.key="&")}).bc(e=>{e.u.spread&&(e.node[f.MapVal.SPREAD]=e.node[f.MapVal.SPREAD]||{o:e.o0.src,v:[]},e.node[f.MapVal.SPREAD].v.push(e.child.node))}),e)),e.rule("elem",e=>(e.open([{s:[r,i],p:"val",u:{spread:!0},n:{pk:1},g:"spread"}]).bc(e=>{e.u.spread&&(e.node[d.ListVal.SPREAD]=e.node[d.ListVal.SPREAD]||{o:e.o0.src,v:[]},e.node[d.ListVal.SPREAD].v.push(e.child.node))}),e))};t.Lang=class{constructor(e){this.options={src:"",print:-1,debug:!1},this.options=Object.assign({},this.options,e);const t=function(e){var t,n;const r=e.require||require;let i=(0,ie.makeMemResolver)({...(null===(t=e.resolver)||void 0===t?void 0:t.mem)||{}}),l=(0,se.makeFileResolver)(e=>"string"==typeof e?e:null==e?void 0:e.peg),s=(0,de.makePkgResolver)({require:r,...(null===(n=e.resolver)||void 0===n?void 0:n.pkg)||{}});return function(e,t,n,r,o){let a="string"==typeof e?e:null==e?void 0:e.peg,u=[],c=i(a,t,n,r,o);return c.path=a,c.found||(u=u.concat(c.search),c=l(a,t,n,r,o),c.path=a,c.found||(u=u.concat(c.search),c=s(a,t,n,r,o),c.path=a,c.found||(c.search=u.concat(c.search)))),c}}(this.options);this.jsonic=g.Jsonic.make(),this.options.debug&&this.jsonic.use(v.Debug,{trace:!0}),this.jsonic.use(j).use(M.MultiSource,{resolver:(null==e?void 0:e.resolver)||t})}parse(e,t){let n,r={fileName:this.options.path,multisource:{path:this.options.path,deps:t&&t.deps||void 0}};t&&null!=t.log&&Number.isInteger(t.log)&&(r.log=t.log);try{n=this.jsonic(e,r)}catch(i){if(!(i instanceof g.JsonicError||"JsonicError"===i.constructor.name))throw i;n=new m.Nil({why:"parse",err:new m.Nil({why:"syntax",msg:i.message,err:i})})}return n}}})),n=e((function(e,t){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.ConjunctVal=t.norm=void 0;const n=u({}),i=p({}),o=s({}),a=l({}),c=h({}),d=r({}),f=m({});class g extends f.ValBase{constructor(e,t){super(e,t),this.isConjunctVal=!0}append(e){return this.peg.push(e),this}unify(e,t){const r=1e7*Math.random()%1e6|0;let l=!0,s=[];for(let i=0;i<this.peg.length;i++)if(s[i]=(0,n.unite)(t,this.peg[i],e,"cj-own"+r),l=l&&be.DONE===s[i].done,s[i]instanceof c.Nil)return c.Nil.make(t,"&peer["+s[i].canon+","+e.canon+"]",this.peg[i],e);s=v(s),s.sort((e,t)=>e.constructor.name===t.constructor.name?0:e.constructor.name<t.constructor.name?-1:1);let u,p,h=[],f=s[0];e:for(let m=0;m<s.length;m++){if(be.DONE!==f.done){let e=(0,n.unite)(t,f,i.TOP,"cj-peer-t0");if(be.DONE!==e.done&&!(e instanceof a.MapVal||e instanceof o.ListVal||e instanceof d.RefVal)){h.push(e);continue e}f=e}let e=s[m+1];if(null==e)h.push(f);else if(f instanceof d.RefVal&&!(e instanceof d.RefVal))h.push(f),f=e;else if(e instanceof d.RefVal&&!(f instanceof d.RefVal))h.push(f),f=e;else if(u=(0,n.unite)(t,f,e,"cj-peer-t0t1"),l=l&&be.DONE===u.done,u instanceof g)h.push(f),f=e;else{if(u instanceof c.Nil)return u;f=u}}return p=0===h.length?i.TOP:1===h.length?h[0]:new g({peg:h},t),p.done=l?be.DONE:this.done+1,p}clone(e,t){let n=super.clone(e,t);return n.peg=this.peg.map(e=>e.clone(null,t)),n}get canon(){return this.peg.map(e=>e.canon).join("&")}gen(e){let t=c.Nil.make(e,"conjunct",this,void 0);if(t.path=this.path,t.url=this.url,t.row=this.row,t.col=this.col,(0,ye.descErr)(t),!e)throw new Error(t.msg);e.err.push(t)}}function v(e){let t=[];for(let n=0,r=0;n<e.length;n++,r++)e[n]instanceof g?(t.push(...e[n].peg),r+=e[n].peg.length-1):t[r]=e[n];return t}t.ConjunctVal=g,t.norm=v})),r=e((function(e,t){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.RefVal=void 0;const r=u({}),s=p({}),o=n({}),a=l({}),c=h({}),d=i({}),f=m({});class g extends f.ValBase{constructor(e,t){super(e,t),this.isRefVal=!0,this.absolute=!1,this.prefix=!1,this.peg=[],this.absolute=!0===this.absolute||!0===e.absolute,this.prefix=!0===e.prefix;for(let n=0;n<e.peg.length;n++)this.append(e.peg[n])}append(e){let t;"string"==typeof e?(t=e,this.peg.push(t)):e instanceof s.StringVal?(t=e.peg,this.peg.push(t)):e instanceof d.VarVal?(t=e,this.peg.push(t)):e instanceof g&&(e.absolute&&(this.absolute=!0),this.prefix?e.prefix&&this.peg.push("."):e.prefix&&(0===this.peg.length?this.prefix=!0:0<this.peg.length&&this.peg.push(".")),this.peg.push(...e.peg))}unify(e,t){let n=this;if(this.id!==e.id){let i=null==t?this:this.find(t);i=i||this,null==i&&this.canon===e.canon?n=this:i instanceof g?s.TOP===e?n=this:e instanceof c.Nil?n=c.Nil.make(t,"ref["+this.peg+"]",this,e):this.canon===e.canon?n=this:(this.done=be.DONE===this.done?be.DONE:this.done+1,n=new o.ConjunctVal({peg:[this,e]},t)):n=(0,r.unite)(t,i,e,"ref"),n.done=be.DONE===n.done?be.DONE:this.done+1}return n}find(e){let t=this.path,n=[],r=[];for(let o=0;o<this.peg.length;o++){let t=this.peg[o];if(t instanceof d.VarVal){let n=t.peg,i=n?""+n.peg:"";if("KEY"===i){if(o!==this.peg.length-1)return;r.push(i)}if("SELF"===i){if(0!==o)return;r.push(i)}else if("PARENT"===i){if(0!==o)return;r.push(i)}else if(0===r.length){if(t=t.unify(s.TOP,e),t instanceof c.Nil)return;t=""+t.peg}}else n.push(t)}t=this.absolute?n:t.slice(0,r.includes("SELF")?0:(r.includes("PARENT"),-1)).concat(n),t=t.reduce((e,t)=>("."===t?e.length=e.length-1:e.push(t),e),[]);let i=e.root,l=0;for(;l<t.length;l++){let e=t[l];if(!(i instanceof a.MapVal))break;i=i.peg[e]}if(l===t.length){if(r.includes("KEY")){let n=t[t.length-1],r=new s.StringVal({peg:null==n?"":n},e);return r.done=be.DONE,r.path=this.path,r}return i}}same(e){return null!=e&&this.peg===e.peg}clone(e,t){return super.clone({peg:this.peg,absolute:this.absolute,...e||{}},t)}get canon(){return(this.absolute?"$":"")+(0<this.peg.length?".":"")+this.peg.map(e=>"."===e?"":e.isVal?e.canon:""+e).join(".")}gen(e){let t=c.Nil.make(e,"ref",this,void 0);if(t.path=this.path,t.url=this.url,t.row=this.row,t.col=this.col,(0,ye.descErr)(t),!e)throw new Error(t.msg);e.err.push(t)}}t.RefVal=g})),i=e((function(e,t){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.VarVal=void 0;const n=p({}),i=h({}),l=r({}),s=m({});class o extends s.ValBase{constructor(e,t){super(e,t),this.isVarVal=!0}unify(e,t){let r,s;return this.peg.isVal?this.peg instanceof l.RefVal?(this.peg.absolute=!0,s=this.peg):s=this.peg.unify(e):s=new n.StringVal({peg:""+this.peg},t),s instanceof l.RefVal||be.DONE!==s.done?r=s:s instanceof n.StringVal?(r=t.var[s.peg],null==r&&(r=i.Nil.make(t,"var["+s.peg+"]",this,e))):r=i.Nil.make(t,"var["+typeof s+"]",this,e),r}same(e){return null!=e&&e instanceof o&&this.peg===e.peg}clone(e,t){return super.clone(e,t)}get canon(){var e;return"$"+((null===(e=this.peg)||void 0===e?void 0:e.isVal)?this.peg.canon:""+this.peg)}gen(e){let t=i.Nil.make(e,"var",this,void 0);if(t.path=this.path,t.url=this.url,t.row=this.row,t.col=this.col,(0,ye.descErr)(t),!e)throw new Error(t.msg);e.err.push(t)}}t.VarVal=o})),l=e((function(e,t){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.MapVal=void 0;const r=u({}),i=p({}),l=n({}),s=h({}),o=m({});class a extends o.ValBase{constructor(e,t){if(super(e,t),this.isMapVal=!0,this.spread={cj:void 0},null==this.peg)throw new Error("MapVal spec.peg undefined");let n=this.peg[a.SPREAD];delete this.peg[a.SPREAD],n&&"&"===n.o&&(this.spread.cj=Array.isArray(n.v)?1<n.v.length?new l.ConjunctVal({peg:n.v},t):n.v[0]:n.v)}unify(e,t){let n=!0,l=i.TOP===e?this:new a({peg:{}},t);l.spread.cj=this.spread.cj,e instanceof a&&(l.spread.cj=null==l.spread.cj?e.spread.cj:null==e.spread.cj?l.spread.cj:l.spread.cj=(0,r.unite)(t,l.spread.cj,e.spread.cj)),l.done=this.done+1;let o=l.spread.cj||i.TOP;for(let i in this.peg){let e=t.descend(i),s=o.clone(null,e);l.peg[i]=(0,r.unite)(e,this.peg[i],s,"map-own"),n=n&&be.DONE===l.peg[i].done}if(e instanceof a){let i=(0,r.unite)(t,e,void 0,"map-peer-map");for(let e in i.peg){let a=i.peg[e],u=l.peg[e],c=l.peg[e]=void 0===u?a:u instanceof s.Nil?u:a instanceof s.Nil?a:(0,r.unite)(t.descend(e),u,a,"map-peer");if(this.spread.cj){let n=t.descend(e),i=o.clone(null,n);c=l.peg[e]=(0,r.unite)(n,l.peg[e],i)}n=n&&be.DONE===c.done}}else if(i.TOP!==e)return s.Nil.make(t,"map",this,e);return l.done=n?be.DONE:l.done,l}clone(e,t){let n=super.clone(e,t);n.peg={};for(let r of Object.entries(this.peg))n.peg[r[0]]=r[1]instanceof o.ValBase?r[1].clone(null,t):r[1];return this.spread.cj&&(n.spread.cj=this.spread.cj.clone(null,t)),n}get canon(){let e=Object.keys(this.peg);return"{"+(this.spread.cj?"&:"+this.spread.cj.canon+(0<e.length?",":""):"")+e.map(e=>[JSON.stringify(e)+":"+this.peg[e].canon]).join(",")+"}"}gen(e){let t={};for(let n in this.peg)t[n]=this.peg[n].gen(e);return t}}t.MapVal=a,a.SPREAD=Symbol("spread")})),s=e((function(e,t){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.ListVal=void 0;const r=u({}),i=p({}),l=n({}),s=h({}),o=m({});class a extends o.ValBase{constructor(e,t){if(super(e,t),this.isListVal=!0,this.spread={cj:void 0},null==this.peg)throw new Error("ListVal spec.peg undefined");let n=this.peg[a.SPREAD];delete this.peg[a.SPREAD],n&&"&"===n.o&&(this.spread.cj=Array.isArray(n.v)&&1<n.v.length?new l.ConjunctVal({peg:n.v},t):n.v)}unify(e,t){let n=!0,l=i.TOP===e?this:new a({peg:[]},t);l.spread.cj=this.spread.cj,e instanceof a&&(l.spread.cj=null==l.spread.cj?e.spread.cj:null==e.spread.cj?l.spread.cj:l.spread.cj=(0,r.unite)(t,l.spread.cj,e.spread.cj)),l.done=this.done+1;let o=l.spread.cj||i.TOP;for(let i in this.peg){let e=t.descend(i),s=o.clone(null,e);l.peg[i]=(0,r.unite)(e,this.peg[i],s,"list-own"),n=n&&be.DONE===l.peg[i].done}if(e instanceof a){let i=(0,r.unite)(t,e,void 0,"list-peer-list");for(let e in i.peg){let a=i.peg[e],u=l.peg[e],c=l.peg[e]=void 0===u?a:u instanceof s.Nil?u:a instanceof s.Nil?a:(0,r.unite)(t.descend(e),u,a,"list-peer");if(this.spread.cj){let n=t.descend(e),i=o.clone(null,n);c=l.peg[e]=(0,r.unite)(n,l.peg[e],i)}n=n&&be.DONE===c.done}}else if(i.TOP!==e)return s.Nil.make(t,"map",this,e);return l.done=n?be.DONE:l.done,l}clone(e,t){let n=super.clone(e,t);return n.peg=this.peg.map(e=>e.clone(null,t)),this.spread.cj&&(n.spread.cj=this.spread.cj.clone(null,t)),n}get canon(){let e=Object.keys(this.peg);return"["+(this.spread.cj?"&:"+this.spread.cj.canon+(0<e.length?",":""):"")+e.map(e=>[this.peg[e].canon]).join(",")+"]"}gen(e){return this.peg.map(t=>t.gen(e))}}t.ListVal=a,a.SPREAD=Symbol("spread")})),o=e((function(e,t){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.DisjunctVal=void 0;const n=u({}),r=h({}),i=a({}),l=m({});class s extends l.ValBase{constructor(e,t,n){super(e,t),this.isDisjunctVal=!0}append(e){return this.peg.push(e),this}unify(e,t){let i,l=!0,o=[];for(let r=0;r<this.peg.length;r++)o[r]=(0,n.unite)(t,this.peg[r],e),l=l&&be.DONE===o[r].done;if(1<o.length){for(let t=0;t<o.length;t++)o[t]instanceof s&&o.splice(t,1,...o[t].peg);let e=new r.Nil;for(let t=0;t<o.length;t++)for(let n=t+1;n<o.length;n++)o[n].same(o[t])&&(o[n]=e);o=o.filter(e=>!(e instanceof r.Nil))}if(1==o.length)i=o[0];else{if(0==o.length)return r.Nil.make(t,"|:empty",this);i=new s({peg:o},t)}return i.done=l?be.DONE:this.done+1,i}clone(e,t){let n=super.clone(e,t);return n.peg=this.peg.map(e=>e.clone(null,t)),n}get canon(){return this.peg.map(e=>e.canon).join("|")}gen(e){if(0<this.peg.length){let t=this.peg.filter(e=>e instanceof i.PrefVal);t=0===t.length?this.peg:t;let n=t[0];for(let r=1;r<this.peg.length;r++){let t=n.unify(this.peg[r],e);n=t}return n.gen(e)}}}t.DisjunctVal=s})),a=e((function(e,t){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.PrefVal=void 0;const n=u({}),r=h({}),i=m({});class l extends i.ValBase{constructor(e,t){super(e,t),this.isPrefVal=!0,this.pref=e.pref||e.peg}unify(e,t){let i,s=!0;return i=new l(e instanceof l?{peg:(0,n.unite)(t,this.peg,e.peg,"Pref000"),pref:(0,n.unite)(t,this.pref,e.pref,"Pref010")}:{peg:(0,n.unite)(null==t?void 0:t.clone({err:[]}),this.peg,e,"Pref020"),pref:(0,n.unite)(null==t?void 0:t.clone({err:[]}),this.pref,e,"Pref030")},t),s=s&&be.DONE===i.peg.done&&(null==i.pref||be.DONE===i.pref.done),i.peg instanceof r.Nil?i=i.pref:i.pref instanceof r.Nil&&(i=i.peg),i.done=s?be.DONE:this.done+1,i}same(e){if(null==e)return!1;let t=this.peg===e.peg||this.peg instanceof i.ValBase&&this.peg.same(e.peg),n=e instanceof l&&(this.pref===e.pref||this.pref instanceof i.ValBase&&this.pref.same(e.pref));return t&&n}clone(e,t){let n=super.clone(e,t);return n.pref=this.pref.clone(null,t),n}get canon(){return this.pref instanceof r.Nil?this.peg.canon:"*"+this.pref.canon}gen(e){let t=this.pref instanceof r.Nil?this.peg instanceof r.Nil?this.pref:this.peg:this.pref;if(t instanceof r.Nil){if((0,ye.descErr)(t),!e)throw new Error(t.msg);e.err.push(t)}return t.gen(e)}}t.PrefVal=l})),u=e((function(e,t){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.unite=t.disjunct=void 0;const n=f({});Object.defineProperty(t,"disjunct",{enumerable:!0,get:function(){return n.disjunct}});const r=c({});Object.defineProperty(t,"unite",{enumerable:!0,get:function(){return r.unite}})})),c=e((function(e,t){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.unite=void 0;const n=h({}),r=p({});function i(e,t){return e}t.unite=(e,t,l,s)=>{let o=t,a="u",u=!1;return!l||r.TOP!==t&&t?!t||r.TOP!==l&&l?t&&l&&r.TOP!==l&&(t.isNil?(o=i(t),a="an"):l.isNil?(o=i(l),a="bn"):t.isConjunctVal?(o=t.unify(l,e),u=!0,a="acj"):l.isConjunctVal||l.isDisjunctVal||l.isRefVal||l.isPrefVal?(o=l.unify(t,e),u=!0,a="bv"):t.constructor===l.constructor&&t.peg===l.peg?(o=i(t),a="up"):(o=t.unify(l,e),u=!0,a="ab")):(o=t,a="a"):(o=l,a="b"),o&&o.unify||(o=n.Nil.make(e,"unite",t,l),a+="N"),be.DONE===o.done||u||(o=o.unify(r.TOP,e),a+="T"),o}})),p=e((function(e,n){"use strict";Object.defineProperty(n,"__esModule",{value:!0}),n.IntegerVal=n.BooleanVal=n.StringVal=n.NumberVal=n.ScalarTypeVal=n.Integer=n.TOP=void 0;const r=d({}),i=t({}),l=h({}),s=m({});class o extends s.ValBase{constructor(){super(null),this.isTop=!0,this.id=0,this.top=!0,this.peg=void 0,this.done=be.DONE,this.path=[],this.row=-1,this.col=-1,this.url="",this.done=be.DONE}unify(e,t){return e}get canon(){return"top"}get site(){return new i.Site(this)}same(e){return this===e}clone(){return this}gen(e){}}const a=new o;n.TOP=a;class u{}n.Integer=u;class c extends s.ValBase{constructor(e,t){super(e,t),this.isScalarTypeVal=!0,this.done=be.DONE}unify(e,t){if(null==e?void 0:e.isScalarVal)return e.type===this.peg||Number===this.peg&&u===e.type?e:l.Nil.make(t,"no-scalar-unify",this,e);if(null==e?void 0:e.isScalarTypeVal){if(Number===this.peg&&u===e.peg)return e;if(Number===e.peg&&u===this.peg)return this}return l.Nil.make(t,"scalar-type",this,e)}get canon(){return this.peg.name.toLowerCase()}same(e){return(null==e?void 0:e.isScalarTypeVal)?this.peg===(null==e?void 0:e.peg):super.same(e)}gen(e){}}n.ScalarTypeVal=c;class p extends s.ValBase{constructor(e,t){super(e,t),this.isScalarVal=!0,this.type=e.type,this.done=be.DONE}clone(e,t){return super.clone({peg:this.peg,type:this.type,...e||{}},t)}unify(e,t){return(null==e?void 0:e.isScalarTypeVal)?e.unify(this,t):e.top?this:l.Nil.make(t,"scalar",this,e)}get canon(){return this.peg.toString()}same(e){return(null==e?void 0:e.isScalarVal)?e.peg===this.peg:super.same(e)}gen(e){return this.peg}}n.NumberVal=class extends p{constructor(e,t){super({peg:e.peg,type:Number},t),this.isNumberVal=!0}unify(e,t){if(null!=e){if(e.isScalarTypeVal&&e.type===Number)return this;if(e.isScalarVal&&e.peg===this.peg)return e.isIntegerVal?e:this}return super.unify(e,t)}},n.IntegerVal=class extends p{constructor(e,t){if(!Number.isInteger(e.peg))throw new Error("not-integer");super({peg:e.peg,type:u},t),this.isIntegerVal=!0}unify(e,t){if(null!=e){if(e.isScalarTypeVal&&(e.peg===Number||e.peg===u))return this;if(e.isScalarVal&&e.peg===this.peg)return this}return super.unify(e,t)}},n.StringVal=class extends p{constructor(e,t){super({peg:e.peg,type:String},t),this.isStringVal=!0}unify(e,t){return super.unify(e,t)}get canon(){return JSON.stringify(this.peg)}};class f extends p{constructor(e,t){super({peg:e.peg,type:Boolean},t),this.isBooleanVal=!0}unify(e,t){return super.unify(e,t)}}n.BooleanVal=f,f.TRUE=new f({peg:!0},new r.Context({vc:1,root:a})),f.FALSE=new f({peg:!1},new r.Context({vc:2,root:a}))})),d=e((function(e,n){"use strict";Object.defineProperty(n,"__esModule",{value:!0}),n.Unify=n.Context=void 0;const r=p({}),i=t({}),l=u({});class s{constructor(e){this.cc=-1,this.var={},this.root=e.root,this.path=e.path||[],this.err=e.err||[],this.vc=null==e.vc?1e9:e.vc,this.cc=null==e.cc?this.cc:e.cc,this.var=e.var||this.var}clone(e){return new s({root:e.root||this.root,path:e.path,err:e.err||this.err,vc:this.vc,cc:this.cc,var:{...this.var}})}descend(e){return this.clone({root:this.root,path:this.path.concat(e)})}}n.Context=s,n.Unify=class{constructor(e,t,n){this.lang=t||new i.Lang,"string"==typeof e&&(e=this.lang.parse(e)),this.cc=0,this.root=e,this.res=e,this.err=e.err||[];let o=e;if(!e.nil){n=n||new s({root:o,err:this.err});let e=9;for(;this.cc<e&&be.DONE!==o.done;this.cc++)n.cc=this.cc,o=(0,l.unite)(n,o,r.TOP),n=n.clone({root:o})}this.res=o}}})),h=e((function(e,t){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.Nil=void 0;const n=m({});class r extends n.ValBase{constructor(e,t){super(e&&"string"!=typeof e?e:{},t),this.isNil=!0,this.nil=!0,this.msg="",e&&"object"==typeof e&&(this.why=null==e?void 0:e.why,this.msg="string"==typeof(null==e?void 0:e.msg)?e.msg:this.msg,this.err=e?Array.isArray(e.err)?[...e.err]:[e.err]:[]),this.done=be.DONE}unify(e,t){return this}clone(e,t){let n=super.clone(e,t);return n.why=this.why,n.primary=this.primary,n.secondary=this.secondary,n.msg=this.msg,n}get canon(){return"nil"}gen(e){if((0,ye.descErr)(this),!e)throw new Error(this.msg);e.err.push(this)}}t.Nil=r,r.make=(e,t,n,i)=>{let l=new r({why:t},e);return null!=n&&(l.row=n.row,l.col=n.col,l.url=n.url,l.primary=n,null!=i)&&(l.secondary=i,l.url===i.url&&(l.row<i.row||l.row===i.row&&l.col<i.col)&&(l.row=i.row,l.col=i.col,l.url=i.url,l.primary=i,l.secondary=n)),e&&e.err.push(l),l}})),f=e((function(e,t){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.disjunct=void 0;const n=o({});m({}),t.disjunct=(e,t,r)=>new n.DisjunctVal({peg:[]},e,[])})),m=e((function(e,n){"use strict";Object.defineProperty(n,"__esModule",{value:!0}),n.ValBase=void 0;const r=t({});n.ValBase=class{constructor(e,t){this.isVal=!0,this.done=0,this.path=[],this.row=-1,this.col=-1,this.url="",this.top=!1,this.peg=void 0,this.err=[],this.peg=null==e?void 0:e.peg,this.path=(null==t?void 0:t.path)||[],this.id=9e9+Math.floor(1e9*Math.random())}same(e){return null!=e&&this.id===e.id}clone(e,t){let n=t?t.clone({path:t.path.concat(this.path.slice(t.path.length))}):void 0,r=new this.constructor(e||{peg:this.peg},n);return null==n&&(r.path=this.path.slice(0)),r}get site(){return new r.Site(this)}unify(e,t){return this}get canon(){return""}gen(e){return null}}})),g={exports:{}};(function(e){(function(){!function(t){"object"==typeof g.exports?g.exports=t():("undefined"!=typeof window?window:void 0!==e?e:"undefined"!=typeof self?self:this).Jsonic=t()}((function(){var e=function(e){var t;return function(n){return t||e(t={exports:{},parent:n},t.exports),t.exports}},t=e((function(e,t){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.modlist=t.findTokenSet=t.values=t.keys=t.omap=t.str=t.prop=t.parserwrap=t.trimstk=t.tokenize=t.srcfmt=t.snip=t.regexp=t.mesc=t.makelog=t.isarr=t.filterRules=t.extract=t.escre=t.errinject=t.errdesc=t.entries=t.defprop=t.deep=t.configure=t.clone=t.clean=t.charset=t.badlex=t.assign=t.S=t.JsonicError=void 0;const i=n({}),l=e=>null==e?[]:Object.keys(e);t.keys=l;const s=e=>null==e?[]:Object.values(e);t.values=s;const o=e=>null==e?[]:Object.entries(e);t.entries=o;const a=(e,...t)=>Object.assign(null==e?{}:e,...t);t.assign=a,t.isarr=e=>Array.isArray(e);const u=Object.defineProperty;t.defprop=u;const c=(e,t)=>Object.entries(e||{}).reduce((e,n)=>{let r=t?t(n):n;void 0===r[0]?delete e[n[0]]:e[r[0]]=r[1];let i=2;for(;void 0!==r[i];)e[r[i]]=r[i+1],i+=2;return e},{});t.omap=c;const p={indent:". ",logindent:"  ",space:" ",gap:"  ",Object:"Object",Array:"Array",object:"object",string:"string",function:"function",unexpected:"unexpected",map:"map",list:"list",elem:"elem",pair:"pair",val:"val",node:"node",no_re_flags:r.EMPTY,unprintable:"unprintable",invalid_ascii:"invalid_ascii",invalid_unicode:"invalid_unicode",invalid_lex_state:"invalid_lex_state",unterminated_string:"unterminated_string",unterminated_comment:"unterminated_comment",lex:"lex",parse:"parse",error:"error",none:"none",imp_map:"imp,map",imp_list:"imp,list",imp_null:"imp,null",end:"end",open:"open",close:"close",rule:"rule",stack:"stack",nUll:"null",name:"name",make:"make",colon:":"};t.S=p;class d extends SyntaxError{constructor(e,t,n,r,i){let l=b(e,t=g({},t),n,r,i);super(l.message),a(this,l),x(this)}toJSON(){return{...this,__error:!0,name:this.name,message:this.message,stack:this.stack}}}function h(e,t,n){let i=t.t,l=i[e];return null==l&&r.STRING===typeof e&&(l=t.tI++,i[l]=e,i[e]=l,i[e.substring(1)]=l,null!=n&&a(n.token,t.t)),l}function f(e,...t){return new RegExp(t.map(e=>e.esc?m(e.toString()):e).join(r.EMPTY),null==e?"":e)}function m(e){return null==e?"":e.replace(/[-\\|\]{}()[^$+*?.!=]/g,"\\$&").replace(/\t/g,"\\t").replace(/\r/g,"\\r").replace(/\n/g,"\\n")}function g(e,...t){let n=p.function===typeof e,r=null!=e&&(p.object===typeof e||n);for(let i of t){let t,l=p.function===typeof i,s=null!=i&&(p.object===typeof i||l);if(r&&s&&!l&&Array.isArray(e)===Array.isArray(i))for(let n in i)e[n]=g(e[n],i[n]);else e=void 0===i?e:l?i:s?p.function===typeof(t=i.constructor)&&p.Object!==t.name&&p.Array!==t.name?i:g(Array.isArray(i)?[]:{},i):i,n=p.function===typeof e,r=null!=e&&(p.object===typeof e||n)}return e}function v(e,t,n,r,i,l){let s={code:t,details:n,token:r,rule:i,ctx:l};return null==e?"":e.replace(/\$(\{?)([\w_0-9]+)(\}?)/g,(e,t,o,a)=>{let u=null!=s[o]?s[o]:null!=n[o]?n[o]:l.meta&&null!=l.meta[o]?l.meta[o]:null!=r[o]?r[o]:null!=i[o]?i[o]:null!=l.opts[o]?l.opts[o]:null!=l.cfg[o]?l.cfg[o]:null!=l[o]?l[o]:"$"+o,c=t&&a?u:JSON.stringify(u);return c=null==c?"":c,c.replace(/\n/g,"\n  ")})}function x(e){e.stack&&(e.stack=e.stack.split("\n").filter(e=>!e.includes("jsonic/jsonic")).map(e=>e.replace(/    at /,"at ")).join("\n"))}function k(e,t,n){let i=0<n.sI?n.sI:0,l=0<n.rI?n.rI:1,s=0<n.cI?n.cI:1,o=null==n.src?r.EMPTY:n.src,a=e.substring(Math.max(0,i-333),i).split("\n"),u=e.substring(i,i+333).split("\n"),c=2+(r.EMPTY+(l+2)).length,p=l<3?1:l-2,d=e=>"\x1b[34m"+(r.EMPTY+p++).padStart(c," ")+" | \x1b[0m"+(null==e?r.EMPTY:e),h=a.length;return[2<h?d(a[h-3]):null,1<h?d(a[h-2]):null,d(a[h-1]+u[0])," ".repeat(c)+"   "+" ".repeat(s-1)+"\x1b[31m"+"^".repeat(o.length||1)+" "+t+"\x1b[0m",d(u[1]),d(u[2])].filter(e=>null!=e).join("\n")}function b(e,t,n,r,i){var l,s,o;try{let a=i.cfg,u=i.meta,c=v(a.error[e]||(null===(l=null==t?void 0:t.use)||void 0===l?void 0:l.err)&&(t.use.err.code||t.use.err.message)||a.error.unknown,e,t,n,r,i);p.function===typeof a.hint&&(a.hint={...a.hint(),...a.hint});let d=["\x1b[31m[jsonic/"+e+"]:\x1b[0m "+c,"  \x1b[34m--\x3e\x1b[0m "+(u&&u.fileName||"<no-file>")+":"+n.rI+":"+n.cI,k(i.src(),c,n),"",v((a.hint[e]||(null===(o=null===(s=t.use)||void 0===s?void 0:s.err)||void 0===o?void 0:o.message)||a.hint.unknown||"").trim().split("\n").map(e=>"  "+e).join("\n"),e,t,n,r,i),"","  \x1b[2mhttps://jsonic.senecajs.org\x1b[0m","  \x1b[2m--internal: rule="+r.name+"~"+r.state+"; token="+h(n.tin,i.cfg)+(null==n.why?"":"~"+n.why)+"; plugins="+i.plgn().map(e=>e.name).join(",")+"--\x1b[0m\n"].join("\n"),f={internal:{token:n,ctx:i}};return f={...Object.create(f),message:d,code:e,details:t,meta:u,fileName:u?u.fileName:void 0,lineNumber:n.rI,columnNumber:n.cI},f}catch(a){return console.log(a),{}}}function y(e){return"function"==typeof e.debug.print.src?e.debug.print.src:t=>{let n=null==t?r.EMPTY:Array.isArray(t)?JSON.stringify(t).replace(/]$/,o(t).filter(e=>isNaN(e[0])).map((e,t)=>(0===t?", ":"")+e[0]+": "+JSON.stringify(e[1]))+"]"):JSON.stringify(t);return n=n.substring(0,e.debug.maxlen)+(e.debug.maxlen<n.length?"...":r.EMPTY),n}}function j(e,t=44){let n;try{n="object"==typeof e?JSON.stringify(e):""+e}catch(r){n=""+e}return S(t<n.length?n.substring(0,t-3)+"...":n,t)}function S(e,t=5){return void 0===e?"":(""+e).substring(0,t).replace(/[\r\n\t]/g,".")}function E(...e){return null==e?{}:e.filter(e=>!1!==e).map(e=>"object"==typeof e?l(e).join(r.EMPTY):e).join(r.EMPTY).split(r.EMPTY).reduce((e,t)=>(e[t]=t.charCodeAt(0),e),{})}function O(e){for(let t in e)null==e[t]&&delete e[t];return e}t.JsonicError=d,t.configure=function(e,t,n){var r,i,u,p,d,g,v,x,k,b,y,j,S,N,_,T,w,P,I,M,C,R,A,V,L,D,$,F,Y,J,B,U,K,q,z,G,Z,W,H,X,Q,ee,te,ne,re,ie,le,se,oe,ae;const ue=t||{};ue.t=ue.t||{},ue.tI=ue.tI||1;const ce=e=>h(e,ue);!1!==n.standard$&&(ce("#BD"),ce("#ZZ"),ce("#UK"),ce("#AA"),ce("#SP"),ce("#LN"),ce("#CM"),ce("#NR"),ce("#ST"),ce("#TX"),ce("#VL")),ue.safe={key:!1!==(null===(r=n.safe)||void 0===r?void 0:r.key)},ue.fixed={lex:!!(null===(i=n.fixed)||void 0===i?void 0:i.lex),token:n.fixed?c(O(n.fixed.token),([e,t])=>[t,h(e,ue)]):{},ref:void 0,check:null===(u=n.fixed)||void 0===u?void 0:u.check},ue.fixed.ref=c(ue.fixed.token,([e,t])=>[e,t]),ue.fixed.ref=Object.assign(ue.fixed.ref,c(ue.fixed.ref,([e,t])=>[t,e])),ue.match={lex:!!(null===(p=n.match)||void 0===p?void 0:p.lex),value:n.match?c(O(n.match.value),([e,t])=>[e,t]):{},token:n.match?c(O(n.match.token),([e,t])=>[h(e,ue),t]):{},check:null===(d=n.match)||void 0===d?void 0:d.check},c(ue.match.token,([e,t])=>[e,(t.tin$=+e,t)]);const pe=n.tokenSet?Object.keys(n.tokenSet).reduce((e,t)=>(e[t]=n.tokenSet[t].filter(e=>null!=e).map(e=>ce(e)),e),{}):{};ue.tokenSet=ue.tokenSet||{},o(pe).map(e=>{let t=e[0],n=e[1];ue.tokenSet[t]?(ue.tokenSet[t].length=0,ue.tokenSet[t].push(...n)):ue.tokenSet[t]=n}),ue.tokenSetTins=o(ue.tokenSet).reduce((e,t)=>(e[t[0]]=e[t[0]]||{},t[1].map(n=>e[t[0]][n]=!0),e),{}),ue.tokenSetTins.IGNORE=ue.tokenSetTins.IGNORE||{},ue.space={lex:!!(null===(g=n.space)||void 0===g?void 0:g.lex),chars:E(null===(v=n.space)||void 0===v?void 0:v.chars),check:null===(x=n.space)||void 0===x?void 0:x.check},ue.line={lex:!!(null===(k=n.line)||void 0===k?void 0:k.lex),chars:E(null===(b=n.line)||void 0===b?void 0:b.chars),rowChars:E(null===(y=n.line)||void 0===y?void 0:y.rowChars),single:!!(null===(j=n.line)||void 0===j?void 0:j.single),check:null===(S=n.line)||void 0===S?void 0:S.check},ue.text={lex:!!(null===(N=n.text)||void 0===N?void 0:N.lex),modify:((null===(_=ue.text)||void 0===_?void 0:_.modify)||[]).concat(([null===(T=n.text)||void 0===T?void 0:T.modify]||[]).flat()).filter(e=>null!=e),check:null===(w=n.text)||void 0===w?void 0:w.check},ue.number={lex:!!(null===(P=n.number)||void 0===P?void 0:P.lex),hex:!!(null===(I=n.number)||void 0===I?void 0:I.hex),oct:!!(null===(M=n.number)||void 0===M?void 0:M.oct),bin:!!(null===(C=n.number)||void 0===C?void 0:C.bin),sep:null!=(null===(R=n.number)||void 0===R?void 0:R.sep)&&""!==n.number.sep,exclude:null===(A=n.number)||void 0===A?void 0:A.exclude,sepChar:null===(V=n.number)||void 0===V?void 0:V.sep,check:null===(L=n.number)||void 0===L?void 0:L.check},ue.value={lex:!!(null===(D=n.value)||void 0===D?void 0:D.lex),def:o((null===($=n.value)||void 0===$?void 0:$.def)||{}).reduce((e,t)=>(null==t[1]||!1===t[1]||t[1].match||(e[t[0]]=t[1]),e),{}),defre:o((null===(F=n.value)||void 0===F?void 0:F.def)||{}).reduce((e,t)=>(t[1]&&t[1].match&&(e[t[0]]=t[1],e[t[0]].consume=!!e[t[0]].consume),e),{})},ue.rule={start:null==(null===(Y=n.rule)||void 0===Y?void 0:Y.start)?"val":n.rule.start,maxmul:null==(null===(J=n.rule)||void 0===J?void 0:J.maxmul)?3:n.rule.maxmul,finish:!!(null===(B=n.rule)||void 0===B?void 0:B.finish),include:(null===(U=n.rule)||void 0===U?void 0:U.include)?n.rule.include.split(/\s*,+\s*/).filter(e=>""!==e):[],exclude:(null===(K=n.rule)||void 0===K?void 0:K.exclude)?n.rule.exclude.split(/\s*,+\s*/).filter(e=>""!==e):[]},ue.map={extend:!!(null===(q=n.map)||void 0===q?void 0:q.extend),merge:null===(z=n.map)||void 0===z?void 0:z.merge},ue.list={property:!!(null===(G=n.list)||void 0===G?void 0:G.property)};let de=Object.keys(ue.fixed.token).sort((e,t)=>t.length-e.length).map(e=>m(e)).join("|"),he=(null===(Z=n.comment)||void 0===Z?void 0:Z.lex)?(n.comment.def?s(n.comment.def):[]).filter(e=>e&&e.lex).map(e=>m(e.start)).join("|"):"",fe=["([",m(l(E(ue.space.lex&&ue.space.chars,ue.line.lex&&ue.line.chars)).join("")),"]",("string"==typeof n.ender?n.ender.split(""):Array.isArray(n.ender)?n.ender:[]).map(e=>"|"+m(e)).join(""),""===de?"":"|",de,""===he?"":"|",he,"|$)"];return ue.rePart={fixed:de,ender:fe,commentStart:he},ue.re={ender:f(null,...fe),rowChars:f(null,m(null===(W=n.line)||void 0===W?void 0:W.rowChars)),columns:f(null,"["+m(null===(H=n.line)||void 0===H?void 0:H.chars)+"]","(.*)$")},ue.lex={empty:!!(null===(X=n.lex)||void 0===X?void 0:X.empty),emptyResult:null===(Q=n.lex)||void 0===Q?void 0:Q.emptyResult,match:(null===(ee=n.lex)||void 0===ee?void 0:ee.match)?o(n.lex.match).reduce((e,t)=>{let r=t[0],i=t[1];if(i){let t=i.make(ue,n);t&&(t.matcher=r,t.make=i.make,t.order=i.order),e.push(t)}return e},[]).filter(e=>null!=e&&!1!==e&&-1<+e.order).sort((e,t)=>e.order-t.order):[]},ue.parse={prepare:s(null===(te=n.parse)||void 0===te?void 0:te.prepare)},ue.debug={get_console:(null===(ne=n.debug)||void 0===ne?void 0:ne.get_console)||(()=>console),maxlen:null==(null===(re=n.debug)||void 0===re?void 0:re.maxlen)?99:n.debug.maxlen,print:{config:!!(null===(le=null===(ie=n.debug)||void 0===ie?void 0:ie.print)||void 0===le?void 0:le.config),src:null===(oe=null===(se=n.debug)||void 0===se?void 0:se.print)||void 0===oe?void 0:oe.src}},ue.error=n.error||{},ue.hint=n.hint||{},(null===(ae=n.config)||void 0===ae?void 0:ae.modify)&&l(n.config.modify).forEach(e=>n.config.modify[e](ue,n)),ue.debug.print.config&&ue.debug.get_console().dir(ue,{depth:null}),ue.result={fail:[]},n.result&&(ue.result.fail=[...n.result.fail]),a(e.options,n),a(e.token,ue.t),a(e.tokenSet,ue.tokenSet),a(e.fixed,ue.fixed.ref),ue},t.tokenize=h,t.findTokenSet=function(e,t){return t.tokenSet[e]},t.mesc=function(e,t){return(t=new String(e)).esc=!0,t},t.regexp=f,t.escre=m,t.deep=g,t.errinject=v,t.trimstk=x,t.extract=k,t.errdesc=b,t.badlex=function(e,t,n){let r=e.next.bind(e);return e.next=(e,i,l,s)=>{let o=r(e,i,l,s);if(t===o.tin){let t={};throw null!=o.use&&(t.use=o.use),new d(o.why||p.unexpected,t,o,e,n)}return o},e},t.makelog=function(e,t){var n,r,i;let l=null===(i=null===(r=null===(n=e.opts)||void 0===n?void 0:n.plugin)||void 0===r?void 0:r.debug)||void 0===i?void 0:i.trace;if(t||l)if("number"==typeof(null==t?void 0:t.log)||l){let n=!1,r=null==t?void 0:t.log;(-1===r||l)&&(r=1,n=!0),e.log=(...t)=>{if(n){let n=t.filter(e=>p.object!=typeof e).map(e=>p.function==typeof e?e.name:e).join(p.gap);e.cfg.debug.get_console().log(n)}else e.cfg.debug.get_console().dir(t,{depth:r})}}else"function"==typeof t.log&&(e.log=t.log);return e.log},t.srcfmt=y,t.str=j,t.snip=S,t.clone=function(e){return g(Object.create(Object.getPrototypeOf(e)),e)},t.charset=E,t.clean=O,t.filterRules=function(e,t){let n=["open","close"];for(let r of n)e.def[r]=e.def[r].map(e=>(e.g="string"==typeof e.g?(e.g||"").split(/\s*,+\s*/):e.g||[],e)).filter(e=>t.rule.include.reduce((t,n)=>t||null!=e.g&&-1!==e.g.indexOf(n),0===t.rule.include.length)).filter(e=>t.rule.exclude.reduce((t,n)=>t&&(null==e.g||-1===e.g.indexOf(n)),!0));return e},t.prop=function(e,t,n){let r=e;try{let r,i=t.split(".");for(let t=0;t<i.length;t++)r=i[t],t<i.length-1&&(e=e[r]=e[r]||{});return void 0!==n&&(e[r]=n),e[r]}catch(i){throw new Error("Cannot "+(void 0===n?"get":"set")+" path "+t+" on object: "+j(r)+(void 0===n?"":" to value: "+j(n,22)))}},t.modlist=function(e,t){if(t&&e){if(0<e.length){if(t.delete&&0<t.delete.length)for(let r=0;r<t.delete.length;r++){let n=t.delete[r];(n<0?-1*n<=e.length:n<e.length)&&(e[(e.length+n)%e.length]=null)}if(t.move)for(let r=0;r<t.move.length;r+=2){let n=(e.length+t.move[r])%e.length,i=(e.length+t.move[r+1])%e.length,l=e[n];e.splice(n,1),e.splice(i,0,l)}let n=e.filter(e=>null!=e);n.length!==e.length&&(e.length=0,e.push(...n))}if(t.custom){let n=t.custom(e);null!=n&&(e=n)}}return e},t.parserwrap=function(e){return{start:function(t,n,l,s){try{return e.start(t,n,l,s)}catch(o){if("SyntaxError"===o.name){let s=0,a=0,u=0,c=r.EMPTY,p=o.message.match(/^Unexpected token (.) .*position\s+(\d+)/i);if(p){c=p[1],s=parseInt(p[2]),a=t.substring(0,s).replace(/[^\n]/g,r.EMPTY).length;let e=s-1;for(;-1<e&&"\n"!==t.charAt(e);)e--;u=Math.max(t.substring(e,s).length,0)}let f=o.token||(0,i.makeToken)("#UK",h("#UK",n.internal().config),void 0,c,(0,i.makePoint)(c.length,s,o.lineNumber||a,o.columnNumber||u));throw new d(o.code||"json",o.details||{msg:o.message},f,{},o.ctx||{uI:-1,opts:n.options,cfg:n.internal().config,token:f,meta:l,src:()=>t,root:()=>{},plgn:()=>n.internal().plugins,inst:()=>n,rule:{name:"no-rule"},sub:{},xs:-1,v2:f,v1:f,t0:f,t1:f,tC:-1,kI:-1,rs:[],rsI:0,rsm:{},n:{},log:l?l.log:void 0,F:y(n.internal().config),u:{},NORULE:{name:"no-rule"},NOTOKEN:{name:"no-token"}})}throw o}}}}})),n=e((function(e,n){"use strict";Object.defineProperty(n,"__esModule",{value:!0}),n.makeTextMatcher=n.makeNumberMatcher=n.makeCommentMatcher=n.makeStringMatcher=n.makeLineMatcher=n.makeSpaceMatcher=n.makeFixedMatcher=n.makeMatchMatcher=n.makeToken=n.makePoint=n.makeLex=n.makeNoToken=void 0;const i=t({});class l{constructor(e,t,n,r){this.len=-1,this.sI=0,this.rI=1,this.cI=1,this.token=[],this.len=e,null!=t&&(this.sI=t),null!=n&&(this.rI=n),null!=r&&(this.cI=r)}toString(){return"Point["+[this.sI+"/"+this.len,this.rI,this.cI]+(0<this.token.length?" "+this.token:"")+"]"}[r.INSPECT](){return this.toString()}}const s=(...e)=>new l(...e);n.makePoint=s;class o{constructor(e,t,n,i,l,s,o){this.isToken=!0,this.name=r.EMPTY,this.tin=-1,this.val=void 0,this.src=r.EMPTY,this.sI=-1,this.rI=-1,this.cI=-1,this.len=-1,this.name=e,this.tin=t,this.src=i,this.val=n,this.sI=l.sI,this.rI=l.rI,this.cI=l.cI,this.use=s,this.why=o,this.len=null==i?0:i.length}resolveVal(e,t){return"function"==typeof this.val?this.val(e,t):this.val}bad(e,t){return this.err=e,null!=t&&(this.use=(0,i.deep)(this.use||{},t)),this}toString(){return"Token["+this.name+"="+this.tin+" "+(0,i.snip)(this.src)+(void 0===this.val||"#ST"===this.name||"#TX"===this.name?"":"="+(0,i.snip)(this.val))+" "+[this.sI,this.rI,this.cI]+(null==this.use?"":" "+(0,i.snip)(""+JSON.stringify(this.use).replace(/"/g,""),22))+(null==this.err?"":" "+this.err)+(null==this.why?"":" "+(0,i.snip)(""+this.why,22))+"]"}[r.INSPECT](){return this.toString()}}const a=(...e)=>new o(...e);function u(e,t,n){let r=e.pnt,i=t;if(e.cfg.fixed.lex&&null!=n&&0<n.length){let l,s=e.cfg.fixed.token[n];null!=s&&(l=e.token(s,void 0,n,r)),null!=l&&(r.sI+=l.src.length,r.cI+=l.src.length,null==t?i=l:r.token.push(l))}return i}n.makeToken=a,n.makeNoToken=()=>a("",-1,void 0,r.EMPTY,s(-1)),n.makeFixedMatcher=(e,t)=>{let n=(0,i.regexp)(null,"^(",e.rePart.fixed,")");return function(t){let r=e.fixed;if(!r.lex)return;if(e.fixed.check){let n=e.fixed.check(t);if(n&&n.done)return n.token}let i=t.pnt,l=t.src.substring(i.sI).match(n);if(l){let e=l[1],n=e.length;if(0<n){let l,s=r.token[e];return null!=s&&(l=t.token(s,void 0,e,i),i.sI+=n,i.cI+=n),l}}}},n.makeMatchMatcher=(e,t)=>{let n=(0,i.values)(e.match.value),r=(0,i.values)(e.match.token);return 0===n.length&&0===r.length?null:function(t,i,l=0){if(!e.match.lex)return;if(e.match.check){let n=e.match.check(t);if(n&&n.done)return n.token}let s=t.pnt,o=t.src.substring(s.sI),a="o"===i.state?0:1;for(let e of n)if(e.match instanceof RegExp){let n=o.match(e.match);if(n){let r=n[0],i=r.length;if(0<i){let l,o=e.val?e.val(n):r;return l=t.token("#VL",o,r,s),s.sI+=i,s.cI+=i,l}}}else{let n=e.match(t,i);if(null!=n)return n}for(let e of r)if(!e.tin$||i.spec.def.tcol[a][l].includes(e.tin$))if(e instanceof RegExp){let n=o.match(e);if(n){let r=n[0],i=r.length;if(0<i){let n,l=e.tin$;return n=t.token(l,r,r,s),s.sI+=i,s.cI+=i,n}}}else{let n=e(t,i);if(null!=n)return n}}},n.makeCommentMatcher=(e,t)=>{let n=t.comment;e.comment={lex:!!n&&!!n.lex,def:((null==n?void 0:n.def)?(0,i.entries)(n.def):[]).reduce((e,[t,n])=>{if(null==n||!1===n)return e;let r={name:t,start:n.start,end:n.end,line:!!n.line,lex:!!n.lex,eatline:!!n.eatline};return e[t]=r,e},{})};let r=e.comment.lex?(0,i.values)(e.comment.def).filter(e=>e.lex&&e.line):[],l=e.comment.lex?(0,i.values)(e.comment.def).filter(e=>e.lex&&!e.line):[];return function(t,n){if(!e.comment.lex)return;if(e.comment.check){let n=e.comment.check(t);if(n&&n.done)return n.token}let s=t.pnt,o=t.src.substring(s.sI),a=s.rI,u=s.cI;for(let i of r)if(o.startsWith(i.start)){let n=o.length,r=i.start.length;for(u+=i.start.length;r<n&&!e.line.chars[o[r]];)u++,r++;if(i.eatline)for(;r<n&&e.line.chars[o[r]];)e.line.rowChars[o[r]]&&a++,r++;let l=o.substring(0,r),c=t.token("#CM",void 0,l,s);return s.sI+=l.length,s.cI=u,s.rI=a,c}for(let r of l)if(o.startsWith(r.start)){let n=o.length,l=r.start.length,c=r.end;for(u+=r.start.length;l<n&&!o.substring(l).startsWith(c);)e.line.rowChars[o[l]]&&(a++,u=0),u++,l++;if(o.substring(l).startsWith(c)){if(u+=c.length,r.eatline)for(;l<n&&e.line.chars[o[l]];)e.line.rowChars[o[l]]&&a++,l++;let i=o.substring(0,l+c.length),p=t.token("#CM",void 0,i,s);return s.sI+=i.length,s.rI=a,s.cI=u,p}return t.bad(i.S.unterminated_comment,s.sI,s.sI+9*r.start.length)}}},n.makeTextMatcher=(e,t)=>{let n=(0,i.regexp)(e.line.lex?null:"s","^(.*?)",...e.rePart.ender);return function(r){if(e.text.check){let t=e.text.check(r);if(t&&t.done)return t.token}let i=e.text,l=r.pnt,s=r.src.substring(l.sI),o=e.value.def,a=e.value.defre,c=s.match(n);if(c){let n,p=c[1],d=c[2];if(null!=p){let t=p.length;if(0<t){let u;if(e.value.lex)if(void 0!==(u=o[p]))n=r.token("#VL",u.val,p,l),l.sI+=t,l.cI+=t;else for(let e in a){let t=a[e];if(t.match){let e=t.match.exec(t.consume?s:p);if(e&&(t.consume||e[0].length===p.length)){let i=e[0];if(null==t.val)n=r.token("#VL",i,i,l);else{let s=t.val(e);n=r.token("#VL",s,i,l)}l.sI+=i.length,l.cI+=i.length}}}null==n&&i.lex&&(n=r.token("#TX",p,p,l),l.sI+=t,l.cI+=t)}}if(n&&(n=u(r,n,d)),n&&0<e.text.modify.length){const i=e.text.modify;for(let l=0;l<i.length;l++)n.val=i[l](n.val,r,e,t)}return n}}},n.makeNumberMatcher=(e,t)=>{let n=e.number,r=(0,i.regexp)(null,["^([-+]?(0(",[n.hex?"x[0-9a-fA-F_]+":null,n.oct?"o[0-7_]+":null,n.bin?"b[01_]+":null].filter(e=>null!=e).join("|"),")|\\.?[0-9]+([0-9_]*[0-9])?)","(\\.[0-9]?([0-9_]*[0-9])?)?","([eE][-+]?[0-9]+([0-9_]*[0-9])?)?"].join("").replace(/_/g,n.sep?(0,i.escre)(n.sepChar):""),")",...e.rePart.ender),l=n.sep?(0,i.regexp)("g",(0,i.escre)(n.sepChar)):void 0;return function(t){if(n=e.number,!n.lex)return;if(e.number.check){let n=e.number.check(t);if(n&&n.done)return n.token}let i=t.pnt,s=t.src.substring(i.sI),o=e.value.def,a=s.match(r);if(a){let n,r=a[1],s=a[9],c=!0;if(null!=r&&(c=!e.number.exclude||!r.match(e.number.exclude))){let s=r.length;if(0<s){let a;if(e.value.lex&&void 0!==(a=o[r]))n=t.token("#VL",a.val,r,i);else{let e=l?r.replace(l,""):r,o=+e;if(isNaN(o)){let t=e[0];"-"!==t&&"+"!==t||(o=("-"===t?-1:1)*+e.substring(1))}isNaN(o)||(n=t.token("#NR",o,r,i),i.sI+=s,i.cI+=s)}}}return c&&(n=u(t,n,s)),n}}},n.makeStringMatcher=(e,t)=>{let n=t.string||{};return e.string=e.string||{},e.string=(0,i.deep)(e.string,{lex:!!(null==n?void 0:n.lex),quoteMap:(0,i.charset)(n.chars),multiChars:(0,i.charset)(n.multiChars),escMap:{...n.escape},escChar:n.escapeChar,escCharCode:null==n.escapeChar?void 0:n.escapeChar.charCodeAt(0),allowUnknown:!!n.allowUnknown,replaceCodeMap:(0,i.omap)((0,i.clean)({...n.replace}),([e,t])=>[e.charCodeAt(0),t]),hasReplace:!1,abandon:!!n.abandon}),e.string.escMap=(0,i.clean)(e.string.escMap),e.string.hasReplace=0<(0,i.keys)(e.string.replaceCodeMap).length,function(t){let n=e.string;if(!n.lex)return;if(e.string.check){let n=e.string.check(t);if(n&&n.done)return n.token}let{quoteMap:l,escMap:s,escChar:o,escCharCode:a,multiChars:u,allowUnknown:c,replaceCodeMap:p,hasReplace:d}=n,{pnt:h,src:f}=t,{sI:m,rI:g,cI:v}=h,x=f.length;if(l[f[m]]){const l=f[m],k=m,b=g,y=u[l];++m,++v;let j,S=[];for(;m<x;m++){v++;let r=f[m];if(j=void 0,l===r){m++;break}if(o===r){m++,v++;let e=s[f[m]];if(null!=e)S.push(e);else if("x"===f[m]){m++;let e=parseInt(f.substring(m,m+2),16);if(isNaN(e)){if(n.abandon)return;return m-=2,v-=2,h.sI=m,h.cI=v,t.bad(i.S.invalid_ascii,m,m+4)}let r=String.fromCharCode(e);S.push(r),m+=1,v+=2}else if("u"===f[m]){m++;let e="{"===f[m]?(m++,1):0,r=e?6:4,l=parseInt(f.substring(m,m+r),16);if(isNaN(l)){if(n.abandon)return;return m=m-2-e,v-=2,h.sI=m,h.cI=v,t.bad(i.S.invalid_unicode,m,m+r+2+2*e)}let s=String.fromCodePoint(l);S.push(s),m+=r-1+e,v+=r+e}else{if(!c){if(n.abandon)return;return h.sI=m,h.cI=v-1,t.bad(i.S.unexpected,m,m+1)}S.push(f[m])}}else if(d&&void 0!==(j=p[f.charCodeAt(m)]))S.push(j),v++;else{let r=m,s=l.charCodeAt(0),o=f.charCodeAt(m);for(;(!d||void 0===(j=p[o]))&&m<x&&32<=o&&s!==o&&a!==o;)o=f.charCodeAt(++m),v++;if(v--,void 0===j&&o<32){if(!y||!e.line.chars[f[m]]){if(n.abandon)return;return h.sI=m,h.cI=v,t.bad(i.S.unprintable,m,m+1)}e.line.rowChars[f[m]]&&(h.rI=++g),v=1,S.push(f.substring(r,m+1))}else S.push(f.substring(r,m)),m--}}if(f[m-1]!==l||h.sI===m-1){if(n.abandon)return;return h.rI=b,t.bad(i.S.unterminated_string,k,m)}const E=t.token("#ST",S.join(r.EMPTY),f.substring(h.sI,m),h);return h.sI=m,h.rI=g,h.cI=v,E}}},n.makeLineMatcher=(e,t)=>function(t){if(!e.line.lex)return;if(e.line.check){let n=e.line.check(t);if(n&&n.done)return n.token}let n,{chars:r,rowChars:i}=e.line,{pnt:l,src:s}=t,{sI:o,rI:a}=l,u=e.line.single;for(u&&(n={});r[s[o]]&&!(n&&(n[s[o]]=(n[s[o]]||0)+1,u&&1<n[s[o]]));)a+=i[s[o]]?1:0,o++;if(l.sI<o){let e=s.substring(l.sI,o);const n=t.token("#LN",void 0,e,l);return l.sI+=e.length,l.rI=a,l.cI=1,n}},n.makeSpaceMatcher=(e,t)=>function(t){if(!e.space.lex)return;if(e.space.check){let n=e.space.check(t);if(n&&n.done)return n.token}let{chars:n}=e.space,{pnt:r,src:i}=t,{sI:l,cI:s}=r;for(;n[i[l]];)l++,s++;if(r.sI<l){let e=i.substring(r.sI,l);const n=t.token("#SP",void 0,e,r);return r.sI+=e.length,r.cI=s,n}};class c{constructor(e){this.src=r.EMPTY,this.ctx={},this.cfg={},this.pnt=s(-1),this.ctx=e,this.src=e.src(),this.cfg=e.cfg,this.pnt=s(this.src.length)}token(e,t,n,r,l,s){let o,u;return"string"==typeof e?(u=e,o=(0,i.tokenize)(u,this.cfg)):(o=e,u=(0,i.tokenize)(e,this.cfg)),a(u,o,t,n,r||this.pnt,l,s)}next(e,t,n,r){let l,s,o=this.pnt,a=o.sI;if(o.end)l=o.end;else if(0<o.token.length)l=o.token.shift();else if(o.len<=o.sI)o.end=this.token("#ZZ",void 0,"",o),l=o.end;else{try{for(let t of this.cfg.lex.match)if(l=t(this,e,r)){s=t;break}}catch(u){l=l||this.token("#BD",void 0,this.src[o.sI],o,{err:u},u.code||i.S.unexpected)}l=l||this.token("#BD",void 0,this.src[o.sI],o,void 0,i.S.unexpected)}return this.ctx.log&&this.ctx.log(i.S.lex,this.ctx,e,this,o,a,s,l,t,n,r),this.ctx.sub.lex&&this.ctx.sub.lex.map(t=>t(l,e,this.ctx)),l}tokenize(e){return(0,i.tokenize)(e,this.cfg)}bad(e,t,n){return this.token("#BD",void 0,0<=t&&t<=n?this.src.substring(t,n):this.src[this.pnt.sI],void 0,void 0,e)}}n.makeLex=(...e)=>new c(...e)})),r={};Object.defineProperty(r,"__esModule",{value:!0}),r.STRING=r.INSPECT=r.EMPTY=r.AFTER=r.BEFORE=r.CLOSE=r.OPEN=void 0,r.OPEN="o",r.CLOSE="c",r.BEFORE="b",r.AFTER="a",r.EMPTY="",r.INSPECT=Symbol.for("nodejs.util.inspect.custom"),r.STRING="string";var i={};Object.defineProperty(i,"__esModule",{value:!0}),i.defaults=void 0;const l=n({}),s={safe:{key:!0},tag:"-",fixed:{lex:!0,token:{"#OB":"{","#CB":"}","#OS":"[","#CS":"]","#CL":":","#CA":","}},match:{lex:!0,token:{}},tokenSet:{IGNORE:["#SP","#LN","#CM"],VAL:["#TX","#NR","#ST","#VL"],KEY:["#TX","#NR","#ST","#VL"]},space:{lex:!0,chars:" \t"},line:{lex:!0,chars:"\r\n",rowChars:"\n",single:!1},text:{lex:!0},number:{lex:!0,hex:!0,oct:!0,bin:!0,sep:"_",exclude:void 0},comment:{lex:!0,def:{hash:{line:!0,start:"#",lex:!0,eatline:!1},slash:{line:!0,start:"//",lex:!0,eatline:!1},multi:{line:!1,start:"/*",end:"*/",lex:!0,eatline:!1}}},string:{lex:!0,chars:"'\"`",multiChars:"`",escapeChar:"\\",escape:{b:"\b",f:"\f",n:"\n",r:"\r",t:"\t",v:"\v",'"':'"',"'":"'","`":"`","\\":"\\","/":"/"},allowUnknown:!0,abandon:!1},map:{extend:!0,merge:void 0},list:{property:!0},value:{lex:!0,def:{true:{val:!0},false:{val:!1},null:{val:null}}},ender:[],plugin:{},debug:{get_console:()=>console,maxlen:99,print:{config:!1,src:void 0}},error:{unknown:"unknown error: $code",unexpected:"unexpected character(s): $src",invalid_unicode:"invalid unicode escape: $src",invalid_ascii:"invalid ascii escape: $src",unprintable:"unprintable character: $src",unterminated_string:"unterminated string: $src",unterminated_comment:"unterminated comment: $src",unknown_rule:"unknown rule: $rulename"},hint:function(e=((e,t="replace")=>e[t](/[A-Z]/g,e=>" "+e.toLowerCase())[t](/[~%][a-z]/g,e=>("~"==e[0]?" ":"")+e[1].toUpperCase())),t="~sinceTheErrorIsUnknown,ThisIsProbablyABugInsideJsonic\nitself,OrAPlugin.~pleaseConsiderPostingAGithubIssue -Thanks!\n\n~code: $code,~details: \n$details|~theCharacter(s) $srcWereNotExpectedAtThisPointAsTheyDoNot\nmatchTheExpectedSyntax,EvenUnderTheRelaxedJsonicRules.~ifIt\nisNotObviouslyWrong,TheActualSyntaxErrorMayBeElsewhere.~try\ncommentingOutLargerAreasAroundThisPointUntilYouGetNoErrors,\nthenRemoveTheCommentsInSmallSectionsUntilYouFindThe\noffendingSyntax.~n%o%t%e:~alsoCheckIfAnyPluginsYouAreUsing\nexpectDifferentSyntaxInThisCase.|~theEscapeSequence $srcDoesNotEncodeAValidUnicodeCodePoint\nnumber.~youMayNeedToValidateYourStringDataManuallyUsingTest\ncodeToSeeHow~javaScriptWillInterpretIt.~alsoConsiderThatYour\ndataMayHaveBecomeCorrupted,OrTheEscapeSequenceHasNotBeen\ngeneratedCorrectly.|~theEscapeSequence $srcDoesNotEncodeAValid~a%s%c%i%iCharacter.~you\nmayNeedToValidateYourStringDataManuallyUsingTestCodeToSee\nhow~javaScriptWillInterpretIt.~alsoConsiderThatYourDataMay\nhaveBecomeCorrupted,OrTheEscapeSequenceHasNotBeenGenerated\ncorrectly.|~stringValuesCannotContainUnprintableCharacters (characterCodes\nbelow 32).~theCharacter $srcIsUnprintable.~youMayNeedToRemove\ntheseCharactersFromYourSourceData.~alsoCheckThatItHasNot\nbecomeCorrupted.|~thisStringHasNoEndQuote.|~thisCommentIsNeverClosed.|~noRuleNamed $rulenameIsDefined.~thisIsProbablyAnErrorInThe\ngrammarOfAPlugin.".split("|")){return"unknown|unexpected|invalid_unicode|invalid_ascii|unprintable|unterminated_string|unterminated_comment|unknown_rule".split("|").reduce((n,r,i)=>(n[r]=e(t[i]),n),{})},lex:{match:{match:{order:1e6,make:l.makeMatchMatcher},fixed:{order:2e6,make:l.makeFixedMatcher},space:{order:3e6,make:l.makeSpaceMatcher},line:{order:4e6,make:l.makeLineMatcher},string:{order:5e6,make:l.makeStringMatcher},comment:{order:6e6,make:l.makeCommentMatcher},number:{order:7e6,make:l.makeNumberMatcher},text:{order:8e6,make:l.makeTextMatcher}},empty:!0,emptyResult:void 0},parse:{prepare:{}},rule:{start:"val",finish:!0,maxmul:3,include:"",exclude:""},result:{fail:[]},config:{modify:{}},parser:{start:void 0}};i.defaults=s;var o={};Object.defineProperty(o,"__esModule",{value:!0}),o.makeRuleSpec=o.makeNoRule=o.makeRule=void 0;const a=t({});class u{constructor(e,t,n){this.i=-1,this.name=r.EMPTY,this.node=null,this.state=r.OPEN,this.n=Object.create(null),this.d=-1,this.u=Object.create(null),this.k=Object.create(null),this.bo=!1,this.ao=!1,this.bc=!1,this.ac=!1,this.os=0,this.cs=0,this.need=0,this.i=t.uI++,this.name=e.name,this.spec=e,this.child=t.NORULE,this.parent=t.NORULE,this.prev=t.NORULE,this.o0=t.NOTOKEN,this.o1=t.NOTOKEN,this.c0=t.NOTOKEN,this.c1=t.NOTOKEN,this.node=n,this.d=t.rsI,this.bo=null!=e.def.bo,this.ao=null!=e.def.ao,this.bc=null!=e.def.bc,this.ac=null!=e.def.ac}process(e,t){return this.spec.process(this,e,t,this.state)}eq(e,t=0){let n=this.n[e];return null==n||n===t}lt(e,t=0){let n=this.n[e];return null==n||n<t}gt(e,t=0){let n=this.n[e];return null==n||n>t}lte(e,t=0){let n=this.n[e];return null==n||n<=t}gte(e,t=0){let n=this.n[e];return null==n||n>=t}toString(){return"[Rule "+this.name+"~"+this.i+"]"}}const c=(...e)=>new u(...e);o.makeRule=c,o.makeNoRule=e=>c(g(e.cfg,{}),e);class p{constructor(){this.p=r.EMPTY,this.r=r.EMPTY,this.b=0}}const d=(...e)=>new p(...e),h=d(),f=d();class m{constructor(e,t){this.name=r.EMPTY,this.def={open:[],close:[],bo:[],bc:[],ao:[],ac:[],tcol:[]},this.cfg=e,this.def=Object.assign(this.def,t),this.def.open=(this.def.open||[]).filter(e=>null!=e),this.def.close=(this.def.close||[]).filter(e=>null!=e);for(let n of[...this.def.open,...this.def.close])v(n)}tin(e){return(0,a.tokenize)(e,this.cfg)}add(e,t,n){let r=(null==n?void 0:n.append)?"push":"unshift",i=((0,a.isarr)(t)?t:[t]).filter(e=>null!=e&&"object"==typeof e).map(e=>v(e)),l="o"===e?"open":"close",s=this.def[l];return s[r](...i),s=this.def[l]=(0,a.modlist)(s,n),(0,a.filterRules)(this,this.cfg),this.norm(),this}open(e,t){return this.add("o",e,t)}close(e,t){return this.add("c",e,t)}action(e,t,n,r){let i=this.def[t+n];return e?i.push(r):i.unshift(r),this}bo(e,t){return this.action(!t||!!e,r.BEFORE,r.OPEN,t||e)}ao(e,t){return this.action(!t||!!e,r.AFTER,r.OPEN,t||e)}bc(e,t){return this.action(!t||!!e,r.BEFORE,r.CLOSE,t||e)}ac(e,t){return this.action(!t||!!e,r.AFTER,r.CLOSE,t||e)}clear(){return this.def.open.length=0,this.def.close.length=0,this.def.bo.length=0,this.def.ao.length=0,this.def.bc.length=0,this.def.ac.length=0,this}norm(){this.def.open.map(e=>v(e)),this.def.close.map(e=>v(e));const e=[];function t(e,t,n){return n[e]=n[e]||[],[function(e,n){if(n.s&&n.s[t]){let r=[...new Set(e.concat(n.s[t]))];e.length=0,e.push(...r)}return e},n[e][t]=n[e][t]||[]]}return this.def.open.reduce(...t(0,0,e)),this.def.open.reduce(...t(0,1,e)),this.def.close.reduce(...t(1,0,e)),this.def.close.reduce(...t(1,1,e)),this.def.tcol=e,this}process(e,t,n,i){t.log&&t.log(a.S.rule,t,e,n);let l="o"===i,s=l?e:t.NORULE,o=l?"O":"C",u=this.def,p=l?u.open:u.close,d=l?e.bo?u.bo:null:e.bc?u.bc:null;if(d){let n;for(let r=0;r<d.length;r++)if(n=d[r].call(this,e,t,s,n),(null==n?void 0:n.isToken)&&(null==n?void 0:n.err))return this.bad(n,e,t,{is_open:l})}let m=0<p.length?function(e,t,n,i,l){let s=h;s.b=0,s.p=r.EMPTY,s.r=r.EMPTY,s.n=void 0,s.h=void 0,s.a=void 0,s.u=void 0,s.k=void 0,s.e=void 0;let o=null,u=0,c=!0,p=1<<l.cfg.t.AA-1,d=l.cfg.tokenSetTins.IGNORE;function f(e,t,r,i){let s;do{s=n.next(e,t,r,i),l.tC++}while(d[s.tin]);return s}let m=t.length;for(u=0;u<m;u++){o=t[u];let n=!1,r=!1;if(c=!0,o.S0){let e=(l.t0=l.NOTOKEN!==l.t0?l.t0:l.t0=f(i,o,u,0)).tin;if(n=!0,c=!!(o.S0[e/31|0]&(1<<e%31-1|p)),c&&(r=null!=o.S1,o.S1)){let e=(l.t1=l.NOTOKEN!==l.t1?l.t1:l.t1=f(i,o,u,1)).tin;r=!0,c=!!(o.S1[e/31|0]&(1<<e%31-1|p))}}if(e?(i.o0=n?l.t0:l.NOTOKEN,i.o1=r?l.t1:l.NOTOKEN,i.os=(n?1:0)+(r?1:0)):(i.c0=n?l.t0:l.NOTOKEN,i.c1=r?l.t1:l.NOTOKEN,i.cs=(n?1:0)+(r?1:0)),c&&o.c&&(c=c&&o.c(i,l,s)),c)break;o=null}c||(s.e=l.t0),o&&(s.n=null!=o.n?o.n:s.n,s.h=null!=o.h?o.h:s.h,s.a=null!=o.a?o.a:s.a,s.u=null!=o.u?o.u:s.u,s.k=null!=o.k?o.k:s.k,s.g=null!=o.g?o.g:s.g,s.e=o.e&&o.e(i,l,s)||void 0,s.p=null!=o.p&&!1!==o.p?"string"==typeof o.p?o.p:o.p(i,l,s):s.p,s.r=null!=o.r&&!1!==o.r?"string"==typeof o.r?o.r:o.r(i,l,s):s.r,s.b=null!=o.b&&!1!==o.b?"number"==typeof o.b?o.b:o.b(i,l,s):s.b);let g=u<t.length;return l.log&&l.log(a.S.parse,l,i,n,g,c,u,o,s),s}(l,p,n,e,t):f;if(m.h&&(m=m.h(e,t,m,s)||m,o+="H"),m.e)return this.bad(m.e,e,t,{is_open:l});if(m.n)for(let r in m.n)e.n[r]=0===m.n[r]?0:(null==e.n[r]?0:e.n[r])+m.n[r];if(m.u&&(e.u=Object.assign(e.u,m.u)),m.k&&(e.k=Object.assign(e.k,m.k)),m.a){o+="A";let n=m.a(e,t,m);if(n&&n.isToken&&n.err)return this.bad(n,e,t,{is_open:l})}if(m.p){t.rs[t.rsI++]=e;let n=t.rsm[m.p];if(!n)return this.bad(this.unknownRule(t.t0,m.p),e,t,{is_open:l});s=e.child=c(n,t,e.node),s.parent=e,s.n={...e.n},0<Object.keys(e.k).length&&(s.k={...e.k}),o+="P`"+m.p+"`"}else if(m.r){let n=t.rsm[m.r];if(!n)return this.bad(this.unknownRule(t.t0,m.r),e,t,{is_open:l});s=c(n,t,e.node),s.parent=e.parent,s.prev=e,s.n={...e.n},0<Object.keys(e.k).length&&(s.k={...e.k}),o+="R`"+m.r+"`"}else l||(s=t.rs[--t.rsI]||t.NORULE);let g=l?e.ao?u.ao:null:e.ac?u.ac:null;if(g){let n;for(let r=0;r<g.length;r++)if(n=g[r](e,t,s,n),(null==n?void 0:n.isToken)&&(null==n?void 0:n.err))return this.bad(n,e,t,{is_open:l})}s.why=o,t.log&&t.log(a.S.node,t,e,n,s),r.OPEN===e.state&&(e.state=r.CLOSE);let v=e[l?"os":"cs"]-(m.b||0);return 1===v?(t.v2=t.v1,t.v1=t.t0,t.t0=t.t1,t.t1=t.NOTOKEN):2==v&&(t.v2=t.t1,t.v1=t.t0,t.t0=t.NOTOKEN,t.t1=t.NOTOKEN),s}bad(e,t,n,r){throw new a.JsonicError(e.err||a.S.unexpected,{...e.use,state:r.is_open?a.S.open:a.S.close},e,t,n)}unknownRule(e,t){return e.err="unknown_rule",e.use=e.use||{},e.use.rulename=t,e}}const g=(...e)=>new m(...e);function v(e){if(r.STRING===typeof e.g?e.g=e.g.split(/\s*,\s*/):null==e.g&&(e.g=[]),e.g=e.g.sort(),e.s&&0!==e.s.length){const t=e=>e.flat().filter(e=>"number"==typeof e),n=(e,t)=>e.filter(e=>31*t<=e&&e<31*(t+1)),r=(e,t)=>e.reduce((e,n)=>1<<n-(31*t+1)|e,0),i=t([e.s[0]]),l=t([e.s[1]]),s=e;s.S0=0<i.length?new Array(Math.max(...i.map(e=>1+e/31|0))).fill(null).map((e,t)=>t).map(e=>r(n(i,e),e)):null,s.S1=0<l.length?new Array(Math.max(...l.map(e=>1+e/31|0))).fill(null).map((e,t)=>t).map(e=>r(n(l,e),e)):null}else e.s=null;return e.p||(e.p=null),e.r||(e.r=null),e.b||(e.b=null),e}o.makeRuleSpec=g;var x={};Object.defineProperty(x,"__esModule",{value:!0}),x.makeParser=x.makeRuleSpec=x.makeRule=void 0;const k=t({}),b=n({});Object.defineProperty(x,"makeRule",{enumerable:!0,get:function(){return o.makeRule}}),Object.defineProperty(x,"makeRuleSpec",{enumerable:!0,get:function(){return o.makeRuleSpec}});class y{constructor(e,t){this.rsm={},this.options=e,this.cfg=t}rule(e,t){if(null==e)return this.rsm;let n=this.rsm[e];if(null===t)delete this.rsm[e];else if(void 0!==t)return n=this.rsm[e]=this.rsm[e]||(0,o.makeRuleSpec)(this.cfg,{}),n=this.rsm[e]=t(this.rsm[e],this)||this.rsm[e],void(n.name=e);return n}start(e,t,n,i){let l,s=(0,b.makeToken)("#ZZ",(0,k.tokenize)("#ZZ",this.cfg),void 0,r.EMPTY,(0,b.makePoint)(-1)),a=(0,b.makeNoToken)(),u={uI:0,opts:this.options,cfg:this.cfg,meta:n||{},src:()=>e,root:()=>l,plgn:()=>t.internal().plugins,inst:()=>t,rule:{},sub:t.internal().sub,xs:-1,v2:s,v1:s,t0:a,t1:a,tC:-2,kI:-1,rs:[],rsI:0,rsm:this.rsm,log:void 0,F:(0,k.srcfmt)(this.cfg),u:{},NOTOKEN:a,NORULE:{}};u=(0,k.deep)(u,i);let c=(0,o.makeNoRule)(u);if(u.NORULE=c,u.rule=c,n&&k.S.function===typeof n.log&&(u.log=n.log),this.cfg.parse.prepare.forEach(e=>e(t,u,n)),""===e){if(this.cfg.lex.empty)return this.cfg.lex.emptyResult;throw new k.JsonicError(k.S.unexpected,{src:e},u.t0,c,u)}let p=(0,k.badlex)((0,b.makeLex)(u),(0,k.tokenize)("#BD",this.cfg),u),d=this.rsm[this.cfg.rule.start];if(null==d)return;let h=(0,o.makeRule)(d,u);l=h;let f=2*(0,k.keys)(this.rsm).length*p.src.length*2*u.cfg.rule.maxmul,m=0;for(;c!==h&&m<f;)u.kI=m,u.rule=h,u.log&&u.log("",u.kI+":"),u.sub.rule&&u.sub.rule.map(e=>e(h,u)),h=h.process(u,p),u.log&&u.log(k.S.stack,u,h,p),m++;if(s.tin!==p.next(h).tin)throw new k.JsonicError(k.S.unexpected,{},u.t0,c,u);const g=u.root().node;if(this.cfg.result.fail.includes(g))throw new k.JsonicError(k.S.unexpected,{},u.t0,c,u);return g}clone(e,t){let n=new y(e,t);return n.rsm=Object.keys(this.rsm).reduce((e,t)=>(e[t]=(0,k.filterRules)(this.rsm[t],this.cfg),e),{}),n.norm(),n}norm(){(0,k.values)(this.rsm).map(e=>e.norm())}}x.makeParser=(...e)=>new y(...e);var j={};function S(e){const{deep:t}=e.util,{OB:n,CB:r,OS:i,CS:l,CL:s,CA:o,TX:a,ST:u,ZZ:c}=e.token,{VAL:p,KEY:d}=e.tokenSet,h=(e,t)=>{if(!t.cfg.rule.finish)return t.t0.src="END_OF_SOURCE",t.t0},f=e=>{const t=e.o0,n=u===t.tin||a===t.tin?t.val:t.src;e.u.key=n};e.rule("val",e=>{e.bo(e=>e.node=void 0).open([{s:[n],p:"map",b:1,g:"map,json"},{s:[i],p:"list",b:1,g:"list,json"},{s:[p],g:"val,json"}]).close([{s:[c],g:"end,json"},{b:1,g:"more,json"}]).bc((e,t)=>{e.node=void 0===e.node?void 0===e.child.node?0===e.os?void 0:e.o0.resolveVal(e,t):e.child.node:e.node})}),e.rule("map",e=>{e.bo(e=>{e.node=Object.create(null)}).open([{s:[n,r],b:1,n:{pk:0},g:"map,json"},{s:[n],p:"pair",n:{pk:0},g:"map,json,pair"}]).close([{s:[r],g:"end,json"}])}),e.rule("list",e=>{e.bo(e=>{e.node=[]}).open([{s:[i,l],b:1,g:"list,json"},{s:[i],p:"elem",g:"list,elem,json"}]).close([{s:[l],g:"end,json"}])}),e.rule("pair",e=>{e.open([{s:[d,s],p:"val",u:{pair:!0},a:f,g:"map,pair,key,json"}]).bc((e,t)=>{e.u.pair&&(e.u.prev=e.node[e.u.key],e.node[e.u.key]=e.child.node)}).close([{s:[o],r:"pair",g:"map,pair,json"},{s:[r],b:1,g:"map,pair,json"}])}),e.rule("elem",e=>{e.open([{p:"val",g:"list,elem,val,json"}]).bc(e=>{!0!==e.u.done&&e.node.push(e.child.node)}).close([{s:[o],r:"elem",g:"list,elem,json"},{s:[l],b:1,g:"list,elem,json"}])});const m=(e,n)=>{let r=e.u.key,i=e.child.node;const l=e.u.prev;i=void 0===i?null:i,e.u.list&&n.cfg.safe.key&&("__proto__"===r||"constructor"===r)||(e.node[r]=null==l?i:n.cfg.map.merge?n.cfg.map.merge(l,i,e,n):n.cfg.map.extend?t(l,i):i)};e.rule("val",e=>{e.open([{s:[d,s],p:"map",b:2,n:{pk:1},g:"pair,jsonic"},{s:[p],g:"val,json"},{s:[[r,l]],b:1,c:e=>0<e.d,g:"val,imp,null,jsonic"},{s:[o],c:e=>0===e.d,p:"list",b:1,g:"list,imp,jsonic"},{s:[o],b:1,g:"list,val,imp,null,jsonic"},{s:[c],g:"jsonic"}],{append:!0,delete:[2]}).close([{s:[[r,l]],b:1,g:"val,json,close",e:(e,t)=>0===e.d?t.t0:void 0},{s:[o],c:e=>e.lte("dlist")&&e.lte("dmap"),r:"list",u:{implist:!0},g:"list,val,imp,comma,jsonic"},{c:e=>e.lte("dlist")&&e.lte("dmap"),r:"list",u:{implist:!0},g:"list,val,imp,space,jsonic",b:1},{s:[c],g:"jsonic"}],{append:!0,move:[1,-1]})}),e.rule("map",e=>{e.bo(e=>{e.n.dmap=1+(e.n.dmap?e.n.dmap:0)}).open([{s:[n,c],b:1,e:h,g:"end,jsonic"}]).open([{s:[d,s],p:"pair",b:2,g:"pair,list,val,imp,jsonic"}],{append:!0}).close([{s:[r],c:e=>e.lte("pk"),g:"end,json"},{s:[r],b:1,g:"path,jsonic"},{s:[[o,l,...p]],b:1,g:"end,path,jsonic"},{s:[c],e:h,g:"end,jsonic"}],{append:!0,delete:[0]})}),e.rule("list",e=>{e.bo(e=>{e.n.dlist=1+(e.n.dlist?e.n.dlist:0),e.prev.u.implist&&(e.node.push(e.prev.node),e.prev.node=e.node)}).open({c:e=>e.prev.u.implist,p:"elem"}).open([{s:[o],p:"elem",b:1,g:"list,elem,val,imp,jsonic"},{p:"elem",g:"list,elem.jsonic"}],{append:!0}).close([{s:[c],e:h,g:"end,jsonic"}],{append:!0})}),e.rule("pair",(e,t)=>{e.open([{s:[o],g:"map,pair,comma,jsonic"}],{append:!0}).bc((e,t)=>{e.u.pair&&m(e,t)}).close([{s:[r],c:e=>e.lte("pk"),b:1,g:"map,pair,json"},{s:[o,r],c:e=>e.lte("pk"),b:1,g:"map,pair,comma,jsonic"},{s:[o,c],g:"end,jsonic"},{s:[o],c:e=>e.lte("pk"),r:"pair",g:"map,pair,json"},{s:[o],c:e=>e.lte("dmap",1),r:"pair",g:"map,pair,jsonic"},{s:[d],c:e=>e.lte("dmap",1),r:"pair",b:1,g:"map,pair,imp,jsonic"},{s:[[r,o,l,...d]],c:e=>0<e.n.pk,b:1,g:"map,pair,imp,path,jsonic"},{s:[l],e:e=>e.c0,g:"end,jsonic"},{s:[c],e:h,g:"map,pair,json"},{r:"pair",b:1,g:"map,pair,imp,jsonic"}],{append:!0,delete:[0,1]})}),e.rule("elem",(e,t)=>{e.open([{s:[o,o],b:2,u:{done:!0},a:e=>e.node.push(null),g:"list,elem,imp,null,jsonic"},{s:[o],u:{done:!0},a:e=>e.node.push(null),g:"list,elem,imp,null,jsonic"},{s:[d,s],e:t.cfg.list.property?void 0:(e,t)=>t.t0,p:"val",n:{pk:1,dmap:1},u:{done:!0,pair:!0,list:!0},a:f,g:"elem,pair,jsonic"}]).bc((e,t)=>{!0===e.u.pair&&(e.u.prev=e.node[e.u.key],m(e,t))}).close([{s:[o,[l,c]],b:1,g:"list,elem,comma,jsonic"},{s:[o],r:"elem",g:"list,elem,json"},{s:[l],b:1,g:"list,elem,json"},{s:[c],e:h,g:"list,elem,json"},{s:[r],e:e=>e.c0,g:"end,jsonic"},{r:"elem",b:1,g:"list,elem,imp,jsonic"}],{delete:[-1,-2]})})}Object.defineProperty(j,"__esModule",{value:!0}),j.makeJSON=j.grammar=void 0,j.grammar=S,j.makeJSON=function(e){let t=e.make({grammar$:!1,text:{lex:!1},number:{hex:!1,oct:!1,bin:!1,sep:null,exclude:/^00+/},string:{chars:'"',multiChars:"",allowUnknown:!1,escape:{v:null}},comment:{lex:!1},map:{extend:!1},lex:{empty:!1},rule:{finish:!1,include:"json"},result:{fail:[void 0,NaN]},tokenSet:{KEY:["#ST",null,null,null]}});return S(t),t};var E={exports:{}};Object.defineProperty(E.exports,"__esModule",{value:!0}),E.exports.root=E.exports.S=E.exports.EMPTY=E.exports.AFTER=E.exports.BEFORE=E.exports.CLOSE=E.exports.OPEN=E.exports.makeTextMatcher=E.exports.makeNumberMatcher=E.exports.makeCommentMatcher=E.exports.makeStringMatcher=E.exports.makeLineMatcher=E.exports.makeSpaceMatcher=E.exports.makeFixedMatcher=E.exports.makeParser=E.exports.makeLex=E.exports.makeRuleSpec=E.exports.makeRule=E.exports.makePoint=E.exports.makeToken=E.exports.make=E.exports.util=E.exports.JsonicError=E.exports.Jsonic=void 0,Object.defineProperty(E.exports,"OPEN",{enumerable:!0,get:function(){return r.OPEN}}),Object.defineProperty(E.exports,"CLOSE",{enumerable:!0,get:function(){return r.CLOSE}}),Object.defineProperty(E.exports,"BEFORE",{enumerable:!0,get:function(){return r.BEFORE}}),Object.defineProperty(E.exports,"AFTER",{enumerable:!0,get:function(){return r.AFTER}}),Object.defineProperty(E.exports,"EMPTY",{enumerable:!0,get:function(){return r.EMPTY}});const O=t({});Object.defineProperty(E.exports,"JsonicError",{enumerable:!0,get:function(){return O.JsonicError}}),Object.defineProperty(E.exports,"S",{enumerable:!0,get:function(){return O.S}});const N=n({});Object.defineProperty(E.exports,"makePoint",{enumerable:!0,get:function(){return N.makePoint}}),Object.defineProperty(E.exports,"makeToken",{enumerable:!0,get:function(){return N.makeToken}}),Object.defineProperty(E.exports,"makeLex",{enumerable:!0,get:function(){return N.makeLex}}),Object.defineProperty(E.exports,"makeFixedMatcher",{enumerable:!0,get:function(){return N.makeFixedMatcher}}),Object.defineProperty(E.exports,"makeSpaceMatcher",{enumerable:!0,get:function(){return N.makeSpaceMatcher}}),Object.defineProperty(E.exports,"makeLineMatcher",{enumerable:!0,get:function(){return N.makeLineMatcher}}),Object.defineProperty(E.exports,"makeStringMatcher",{enumerable:!0,get:function(){return N.makeStringMatcher}}),Object.defineProperty(E.exports,"makeCommentMatcher",{enumerable:!0,get:function(){return N.makeCommentMatcher}}),Object.defineProperty(E.exports,"makeNumberMatcher",{enumerable:!0,get:function(){return N.makeNumberMatcher}}),Object.defineProperty(E.exports,"makeTextMatcher",{enumerable:!0,get:function(){return N.makeTextMatcher}}),Object.defineProperty(E.exports,"makeRule",{enumerable:!0,get:function(){return x.makeRule}}),Object.defineProperty(E.exports,"makeRuleSpec",{enumerable:!0,get:function(){return x.makeRuleSpec}}),Object.defineProperty(E.exports,"makeParser",{enumerable:!0,get:function(){return x.makeParser}});const _={tokenize:O.tokenize,srcfmt:O.srcfmt,clone:O.clone,charset:O.charset,trimstk:O.trimstk,makelog:O.makelog,badlex:O.badlex,extract:O.extract,errinject:O.errinject,errdesc:O.errdesc,configure:O.configure,parserwrap:O.parserwrap,mesc:O.mesc,escre:O.escre,regexp:O.regexp,prop:O.prop,str:O.str,clean:O.clean,deep:O.deep,omap:O.omap,keys:O.keys,values:O.values,entries:O.entries};function T(e,t){let n=!0;if("jsonic"===e)n=!1;else if("json"===e)return(0,j.makeJSON)(w);e="string"==typeof e?{}:e;let r={parser:null,config:null,plugins:[],sub:{lex:void 0,rule:void 0},mark:Math.random()},l=(0,O.deep)({},t?{...t.options}:!1===(null==e?void 0:e.defaults$)?{}:i.defaults,e||{}),s=function(e,t,n){var r;if(O.S.string===typeof e){let i=s.internal();return((null===(r=o.parser)||void 0===r?void 0:r.start)?(0,O.parserwrap)(o.parser):i.parser).start(e,s,t,n)}return e},o=e=>{if(null!=e&&O.S.object===typeof e){(0,O.deep)(l,e),(0,O.configure)(s,r.config,l);let t=s.internal().parser;r.parser=t.clone(l,r.config)}return{...s.options}},a={token:e=>(0,O.tokenize)(e,r.config,s),tokenSet:e=>(0,O.findTokenSet)(e,r.config),fixed:e=>r.config.fixed.ref[e],options:(0,O.deep)(o,l),config:()=>(0,O.deep)(r.config),parse:s,use:function(e,t){if(O.S.function!==typeof e)throw new Error("Jsonic.use: the first argument must be a function defining a plugin. See https://jsonic.senecajs.org/plugin");const n=e.name.toLowerCase(),r=(0,O.deep)({},e.defaults||{},t||{});s.options({plugin:{[n]:r}});let i=s.options.plugin[n];return s.internal().plugins.push(e),e.options=i,e(s,i)||s},rule:(e,t)=>s.internal().parser.rule(e,t)||s,make:e=>T(e,s),empty:e=>T({defaults$:!1,standard$:!1,grammar$:!1,...e||{}}),id:"Jsonic/"+Date.now()+"/"+(""+Math.random()).substring(2,8).padEnd(6,"0")+(null==o.tag?"":"/"+o.tag),toString:()=>a.id,sub:e=>(e.lex&&(r.sub.lex=r.sub.lex||[],r.sub.lex.push(e.lex)),e.rule&&(r.sub.rule=r.sub.rule||[],r.sub.rule.push(e.rule)),s),util:_};if((0,O.defprop)(a.make,O.S.name,{value:O.S.make}),n?(0,O.assign)(s,a):(0,O.assign)(s,{empty:a.empty,parse:a.parse,sub:a.sub,id:a.id,toString:a.toString}),(0,O.defprop)(s,"internal",{value:()=>r}),t){for(let n in t)void 0===s[n]&&(s[n]=t[n]);s.parent=t;let e=t.internal();r.config=(0,O.deep)({},e.config),(0,O.configure)(s,r.config,l),(0,O.assign)(s.token,r.config.t),r.plugins=[...e.plugins],r.parser=e.parser.clone(l,r.config)}else{let e={...s,...a};r.config=(0,O.configure)(e,void 0,l),r.plugins=[],r.parser=(0,x.makeParser)(l,r.config),!1!==l.grammar$&&(0,j.grammar)(e)}return s}let w;E.exports.util=_,E.exports.make=T,E.exports.root=w;let P=E.exports.root=w=T("jsonic");return E.exports.Jsonic=P,w.Jsonic=w,w.JsonicError=O.JsonicError,w.makeLex=N.makeLex,w.makeParser=x.makeParser,w.makeToken=N.makeToken,w.makePoint=N.makePoint,w.makeRule=x.makeRule,w.makeRuleSpec=x.makeRuleSpec,w.makeFixedMatcher=N.makeFixedMatcher,w.makeSpaceMatcher=N.makeSpaceMatcher,w.makeLineMatcher=N.makeLineMatcher,w.makeStringMatcher=N.makeStringMatcher,w.makeCommentMatcher=N.makeCommentMatcher,w.makeNumberMatcher=N.makeNumberMatcher,w.makeTextMatcher=N.makeTextMatcher,w.OPEN=r.OPEN,w.CLOSE=r.CLOSE,w.BEFORE=r.BEFORE,w.AFTER=r.AFTER,w.EMPTY=r.EMPTY,w.util=_,w.make=T,w.S=O.S,E.exports.default=P,E.exports=P,E.exports}))}).call(this)}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{}),g=g.exports;var v={};Object.defineProperty(v,"__esModule",{value:!0}),v.Debug=void 0;const{entries:x,tokenize:k}=g.util,b=(e,t)=>{const{keys:n,values:r,entries:i}=e.util;e.debug={describe:function(){let t=e.internal().config,l=t.lex.match,s=e.rule();return["========= TOKENS ========",Object.entries(t.t).filter(e=>"string"==typeof e[1]).map(e=>{return"  "+e[0]+"\t"+e[1]+"\t"+((n=t.fixed.ref[e[0]]||"")?'"'+n+'"':"");var n}).join("\n"),"\n","========= RULES =========",j(e,n(s),s),"\n","========= ALTS =========",r(s).map(t=>"  "+t.name+":\n"+y(e,t,"open")+y(e,t,"close")).join("\n\n"),"\n","========= LEXER =========","  "+(l&&l.map(e=>e.order+": "+e.matcher+" ("+e.make.name+")")||[]).join("\n  "),"\n","\n","========= PLUGIN =========","  "+e.internal().plugins.map(e=>e.name+(e.options?i(e.options).reduce((e,t)=>e+"\n    "+t[0]+": "+JSON.stringify(t[1]),""):"")).join("\n  "),"\n"].join("\n")}};const l=e.use.bind(e);e.use=(...e)=>{let n=l(...e);return t.print&&n.internal().config.debug.get_console().log("USE:",e[0].name,"\n\n",n.debug.describe()),n},t.trace&&e.options({parse:{prepare:{debug:(e,t,n)=>{t.log=t.log||((e,...n)=>{T[e]&&t.cfg.debug.get_console().log(T[e](...n).filter(e=>"object"!=typeof e).map(e=>"function"==typeof e?e.name:e).join("  "))})}}}})};function y(e,t,n){const{entries:r}=e.util;return 0===t.def[n].length?"":"    "+n.toUpperCase()+":\n"+t.def[n].map((t,n)=>{var i,l;return"      "+(""+n).padStart(5," ")+" "+("["+(t.s||[]).map(t=>null==t?"***INVALID***":"number"==typeof t?e.token[t]:"["+t.map(t=>e.token[t])+"]").join(" ")+"] ").padEnd(32," ")+(t.r?" r="+("string"==typeof t.r?t.r:"<F>"):"")+(t.p?" p="+("string"==typeof t.p?t.p:"<F>"):"")+(t.r||t.p?"":"\t")+"\t"+(null==t.b?"":"b="+t.b)+"\t"+(null==t.n?"":"n="+r(t.n).map(([e,t])=>e+":"+t))+"\t"+(null==t.a?"":"A")+(null==t.c?"":"C")+(null==t.h?"":"H")+"\t"+(null==(null===(i=t.c)||void 0===i?void 0:i.n)?"\t":" CN="+r(t.c.n).map(([e,t])=>e+":"+t))+(null==(null===(l=t.c)||void 0===l?void 0:l.d)?"":" CD="+t.c.d)+(t.g?"\tg="+t.g:"")}).join("\n")+"\n"}function j(e,t,n){const{values:r,omap:i}=e.util;return t.reduce((e,t)=>e+="  "+t+":\n    "+r(i({op:S(n,t,"open","p"),or:S(n,t,"open","r"),cp:S(n,t,"close","p"),cr:S(n,t,"close","r")},([e,t])=>[1<t.length?e:void 0,e+": "+t])).join("\n    ")+"\n","")}function S(e,t,n,r){return[...new Set(e[t].def[n].filter(e=>e[r]).map(e=>e[r]).map(e=>"string"==typeof e?e:"<F>"))].join(" ")}function E(e,t,n){return e.F(e.src().substring(n.pnt.sI,n.pnt.sI+16)).padEnd(18," ")+" "+function(e){return"["+(e.NOTOKEN===e.t0?"":e.F(e.t0.src))+(e.NOTOKEN===e.t1?"":" "+e.F(e.t1.src))+"]~["+(e.NOTOKEN===e.t0?"":k(e.t0.tin,e.cfg))+(e.NOTOKEN===e.t1?"":" "+k(e.t1.tin,e.cfg))+"]"}(e).padEnd(34," ")+" "+(""+t.d).padStart(4," ")}function O(e,t){let n=x(t.n),r=x(t.u),i=x(t.k);return(0===n.length?"":" N<"+n.filter(e=>e[1]).map(e=>e[0]+"="+e[1]).join(";")+">")+(0===r.length?"":" U<"+r.map(t=>t[0]+"="+e.F(t[1])).join(";")+">")+(0===i.length?"":" K<"+i.map(t=>t[0]+"="+e.F(t[1])).join(";")+">")}function N(e,t){return"["+(e.s||[]).map(e=>"number"==typeof e?k(e,t):Array.isArray(e)?"["+e.map(e=>k(e,t))+"]":"").join(" ")+"] "}v.Debug=b;const _={o:g.S.open.toUpperCase(),c:g.S.close.toUpperCase()},T={"":(...e)=>e,stack:(e,t,n)=>[g.S.logindent+g.S.stack,E(e,t,n),g.S.indent.repeat(t.d)+"/"+e.rs.slice(0,t.d).map(e=>e.name+"~"+e.i).join("/"),"~","/"+e.rs.slice(0,t.d).map(t=>e.F(t.node)).join("/"),e,t,n],rule:(e,t,n)=>[t,e,n,g.S.logindent+g.S.rule+g.S.space,E(e,t,n),g.S.indent.repeat(t.d)+(t.name+"~"+t.i+g.S.colon+_[t.state]).padEnd(16),("prev="+t.prev.i+" parent="+t.parent.i+" child="+t.child.i).padEnd(28),O(e,t)],node:(e,t,n,r)=>[t,e,n,r,g.S.logindent+g.S.node+g.S.space,E(e,t,n),g.S.indent.repeat(t.d)+("why="+r.why+g.S.space+"<"+e.F(t.node)+">").padEnd(46),O(e,t)],parse:(e,t,n,r,i,l,s,o)=>{let a=r&&o.n?x(o.n):null,u=r&&o.u?x(o.u):null,c=r&&o.k?x(o.k):null;return[e,t,n,g.S.logindent+g.S.parse,E(e,t,n),g.S.indent.repeat(t.d)+(r?"alt="+l:"no-alt"),r&&s?N(s,e.cfg):"",r&&o.g?"g:"+o.g+" ":"",(r&&o.p?"p:"+o.p+" ":"")+(r&&o.r?"r:"+o.r+" ":"")+(r&&o.b?"b:"+o.b+" ":""),s&&s.c?"c:"+i:g.EMPTY,null==a?"":"n:"+a.map(e=>e[0]+"="+e[1]).join(";"),null==u?"":"u:"+u.map(e=>e[0]+"="+e[1]).join(";"),null==c?"":"k:"+c.map(e=>e[0]+"="+e[1]).join(";")]},lex:(e,t,n,r,i,l,s,o,a,u)=>[g.S.logindent+g.S.lex+g.S.space+g.S.space,E(e,t,n),g.S.indent.repeat(t.d)+k(s.tin,e.cfg),e.F(s.src),r.sI,r.rI+":"+r.cI,(null==l?void 0:l.name)||"",o?"on:alt="+a+";"+o.g+";t="+u+";"+N(o,e.cfg):"",e.F(n.src.substring(i,i+16)),e,t,n]};b.defaults={print:!0,trace:!1};var w={exports:{}};(function(e){(function(){!function(t){"object"==typeof w.exports?w.exports=t():("undefined"!=typeof window?window:void 0!==e?e:"undefined"!=typeof self?self:this).JsonicDirective=t()}((function(){var e={};Object.defineProperty(e,"__esModule",{value:!0}),e.Directive=void 0;const t=e=>("string"==typeof e?e.split(/\s*,\s*/):e||[]).filter(e=>null!=e&&""!==e),n=(e,n)=>{var r,i;let l,s={open:t(null===(r=null==n?void 0:n.rules)||void 0===r?void 0:r.open),close:t(null===(i=null==n?void 0:n.rules)||void 0===i?void 0:i.close)},o=n.name,a=n.open,u=n.close,c=n.custom;if("string"==typeof n.action){let t=n.action;l=n=>n.node=e.util.prop(e.options,t)}else l=n.action;let p={},d="#OD_"+o,h="#CD_"+o,f=e.fixed(a),m=null==u?null:e.fixed(u);if(null!=f)throw new Error("Directive open token already in use: "+a);p[d]=a,null==m&&null!=u&&(p[h]=u),e.options({fixed:{token:p},error:{[o+"_close"]:null==u?null:"directive "+o+' close "'+u+'" without open "'+a+'"'},hint:{[o+"_close"]:null==u?null:`\nThe ${o} directive must start with the characters "${a}" and end\nwith the characters "${u}". The end characters "${u}" may not\nappear without the start characters "${a}" appearing first:\n"${a}...${u}".\n`}});let g=e.token.CA;f=e.fixed(a),m=null==u?null:e.fixed(u),s.open.forEach(t=>{e.rule(t,e=>(e.open({s:[f],p:o,n:{["dr_"+o]:1},g:"start"}),null!=u&&(e.open({s:[f,m],b:1,p:o,n:{["dr_"+o]:1},g:"start,end"}),e.close({s:[m],b:1,g:"end"})),e))}),null!=u&&s.close.forEach(t=>{e.rule(t,e=>{e.close([{s:[m],c:e=>1===e.n["dr_"+o],b:1,g:"end"},{s:[g,m],c:e=>1===e.n["dr_"+o],b:1,g:"end,comma"}])})}),e.rule(o,e=>e.clear().bo(e=>{e.node={}}).open([null!=u?{s:[m],b:1}:null,{p:"val",n:null==u?{dlist:1,dmap:1}:{dlist:0,dmap:0}}]).bc((function(e,t,n,r){let i=l.call(this,e,t,n,r);if(null==i?void 0:i.isToken)return i})).close(null!=u?[{s:[m]},{s:[g,m]}]:[])),c&&c(e,{OPEN:f,CLOSE:m,name:o})};return e.Directive=n,n.defaults={rules:{open:"val",close:"list,elem,map,pair"}},e}))}).call(this)}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{}),w=w.exports;var P={};Object.defineProperty(P,"__esModule",{value:!0}),P.makeJsonicProcessor=void 0,P.makeJsonicProcessor=function(){return function(e,t,n,r,i){null!=e.src&&null!=e.full&&(e.val=i(e.src,r.meta))}};var I={};Object.defineProperty(I,"__esModule",{value:!0}),I.makeJavaScriptProcessor=void 0,I.makeJavaScriptProcessor=function(e){const t=e=>{e.val=function(e,t){let n;return n=require(e.full),n=null!=n.default?n.default:n,n}(e)};return t.opts=e,t};var M={};Object.defineProperty(M,"__esModule",{value:!0}),M.meta=M.TOP=M.NONE=M.resolvePathSpec=M.MultiSource=void 0;M.NONE="";const C=Symbol("TOP");M.TOP=C;const R=(e,t)=>{const n=t.markchar,r=t.resolver,i=t.processor,{deep:l}=e.util,s=t.implictExt||[];for(let a=0;a<s.length;a++){let e=s[a];s[a]=e.startsWith(".")?e:"."+e}e.options({error:{multisource_not_found:"source not found: $path"},hint:{multisource_not_found:"The source path $path was not found.\n\nSearch paths:\n${searchstr}"}});let o={name:"multisource",open:n,rules:{open:"val,pair"},action:function(n,s){var o,a;let u=n.parent.name,c=n.child.node,p=r(c,t,n,s,e);if(!p.found)return null===(o=n.parent)||void 0===o?void 0:o.o0.bad("multisource_not_found",{...p,searchstr:((null==p?void 0:p.search)||[p.full]).join("\n")});let d=null!=p.full?p.full:null!=p.path?p.path:"no-path";p.kind=null==p.kind?"":p.kind;let h=(null===(a=s.meta)||void 0===a?void 0:a.multisource)||{},f=h.parents||[];null!=h.path&&f.push(h.path);let m={...s.meta||{},fileName:p.path,multisource:{...h,parents:f,path:p.full}};if(h.deps){let e=h.deps,t=h.path||C;if(null!=t){let n={tar:t,src:d,wen:Date.now()};e[t]=e[t]||{},e[t][d]=n}}let g={...s,meta:m};(i[p.kind]||i[""])(p,t,n,g,e),"pair"===u?s.cfg.map.merge?n.parent.parent.node=s.cfg.map.merge(n.parent.parent.node,p.val,n,s):s.cfg.map.extend?n.parent.parent.node=l(n.parent.parent.node,p.val):Object.assign(n.parent.node,p.val):n.node=p.val},custom:(e,{OPEN:t,name:n})=>{e.rule("val",e=>{e.open({s:[t],c:e=>0===e.d,p:"map",b:1,n:{[n+"_top"]:1}})}),e.rule("map",e=>{e.open({s:[t],c:e=>1===e.d&&1===e.n[n+"_top"],p:"pair",b:1})})}};e.use(w.Directive,o)};function A(e){return t=>t.val=e(t.src,t)}M.MultiSource=R;const V=A(e=>e),L=g.Jsonic.make("json"),D=A((e,t)=>null==e?void 0:L(e,{fileName:t.path})),$=(0,P.makeJsonicProcessor)(),F=(0,I.makeJavaScriptProcessor)();R.defaults={markchar:"@",processor:{"":V,jsonic:$,jsc:$,json:D,js:F},implictExt:["jsonic","jsc","json","js"]},M.resolvePathSpec=function(e,t,n,r){var i;let l=null===(i=t.meta)||void 0===i?void 0:i.multisource,s=r(null==l||null==l.path?e.path:l.path),o="string"==typeof n?n:null!=n.path?""+n.path:void 0,a=!(!(null==o?void 0:o.startsWith("/"))&&!(null==o?void 0:o.startsWith("\\"))),u=a?o:null!=o&&""!=o?null!=s&&""!=s?s+"/"+o:o:void 0;return{kind:null==u?"":(u.match(/\.([^.]*)$/)||["",""])[1],path:o,full:u,base:s,abs:a,found:!1}},M.meta={name:"MultiSource"};var Y,J,B,U={},K=Y={};function q(){throw new Error("setTimeout has not been defined")}function z(){throw new Error("clearTimeout has not been defined")}function G(e){if(J===setTimeout)return setTimeout(e,0);if((J===q||!J)&&setTimeout)return J=setTimeout,setTimeout(e,0);try{return J(e,0)}catch(t){try{return J.call(null,e,0)}catch(t){return J.call(this,e,0)}}}!function(){try{J="function"==typeof setTimeout?setTimeout:q}catch(e){J=q}try{B="function"==typeof clearTimeout?clearTimeout:z}catch(e){B=z}}();var Z,W=[],H=!1,X=-1;function Q(){H&&Z&&(H=!1,Z.length?W=Z.concat(W):X=-1,W.length&&ee())}function ee(){if(!H){var e=G(Q);H=!0;for(var t=W.length;t;){for(Z=W,W=[];++X<t;)Z&&Z[X].run();X=-1,t=W.length}Z=null,H=!1,function(e){if(B===clearTimeout)return clearTimeout(e);if((B===z||!B)&&clearTimeout)return B=clearTimeout,clearTimeout(e);try{B(e)}catch(t){try{return B.call(null,e)}catch(t){return B.call(this,e)}}}(e)}}function te(e,t){this.fun=e,this.array=t}function ne(){}K.nextTick=function(e){var t=new Array(arguments.length-1);if(arguments.length>1)for(var n=1;n<arguments.length;n++)t[n-1]=arguments[n];W.push(new te(e,t)),1!==W.length||H||G(ee)},te.prototype.run=function(){this.fun.apply(null,this.array)},K.title="browser",K.browser=!0,K.env={},K.argv=[],K.version="",K.versions={},K.on=ne,K.addListener=ne,K.once=ne,K.off=ne,K.removeListener=ne,K.removeAllListeners=ne,K.emit=ne,K.prependListener=ne,K.prependOnceListener=ne,K.listeners=function(e){return[]},K.binding=function(e){throw new Error("process.binding is not supported")},K.cwd=function(){return"/"},K.chdir=function(e){throw new Error("process.chdir is not supported")},K.umask=function(){return 0};var re={};(function(e){(function(){"use strict";function t(e){if("string"!=typeof e)throw new TypeError("Path must be a string. Received "+JSON.stringify(e))}function n(e,t){for(var n,r="",i=0,l=-1,s=0,o=0;o<=e.length;++o){if(o<e.length)n=e.charCodeAt(o);else{if(47===n)break;n=47}if(47===n){if(l===o-1||1===s);else if(l!==o-1&&2===s){if(r.length<2||2!==i||46!==r.charCodeAt(r.length-1)||46!==r.charCodeAt(r.length-2))if(r.length>2){var a=r.lastIndexOf("/");if(a!==r.length-1){-1===a?(r="",i=0):i=(r=r.slice(0,a)).length-1-r.lastIndexOf("/"),l=o,s=0;continue}}else if(2===r.length||1===r.length){r="",i=0,l=o,s=0;continue}t&&(r.length>0?r+="/..":r="..",i=2)}else r.length>0?r+="/"+e.slice(l+1,o):r=e.slice(l+1,o),i=o-l-1;l=o,s=0}else 46===n&&-1!==s?++s:s=-1}return r}var r={resolve:function(){for(var r,i="",l=!1,s=arguments.length-1;s>=-1&&!l;s--){var o;s>=0?o=arguments[s]:(void 0===r&&(r=e.cwd()),o=r),t(o),0!==o.length&&(i=o+"/"+i,l=47===o.charCodeAt(0))}return i=n(i,!l),l?i.length>0?"/"+i:"/":i.length>0?i:"."},normalize:function(e){if(t(e),0===e.length)return".";var r=47===e.charCodeAt(0),i=47===e.charCodeAt(e.length-1);return 0!==(e=n(e,!r)).length||r||(e="."),e.length>0&&i&&(e+="/"),r?"/"+e:e},isAbsolute:function(e){return t(e),e.length>0&&47===e.charCodeAt(0)},join:function(){if(0===arguments.length)return".";for(var e,n=0;n<arguments.length;++n){var i=arguments[n];t(i),i.length>0&&(void 0===e?e=i:e+="/"+i)}return void 0===e?".":r.normalize(e)},relative:function(e,n){if(t(e),t(n),e===n)return"";if((e=r.resolve(e))===(n=r.resolve(n)))return"";for(var i=1;i<e.length&&47===e.charCodeAt(i);++i);for(var l=e.length,s=l-i,o=1;o<n.length&&47===n.charCodeAt(o);++o);for(var a=n.length-o,u=s<a?s:a,c=-1,p=0;p<=u;++p){if(p===u){if(a>u){if(47===n.charCodeAt(o+p))return n.slice(o+p+1);if(0===p)return n.slice(o+p)}else s>u&&(47===e.charCodeAt(i+p)?c=p:0===p&&(c=0));break}var d=e.charCodeAt(i+p);if(d!==n.charCodeAt(o+p))break;47===d&&(c=p)}var h="";for(p=i+c+1;p<=l;++p)p!==l&&47!==e.charCodeAt(p)||(0===h.length?h+="..":h+="/..");return h.length>0?h+n.slice(o+c):(o+=c,47===n.charCodeAt(o)&&++o,n.slice(o))},_makeLong:function(e){return e},dirname:function(e){if(t(e),0===e.length)return".";for(var n=e.charCodeAt(0),r=47===n,i=-1,l=!0,s=e.length-1;s>=1;--s)if(47===(n=e.charCodeAt(s))){if(!l){i=s;break}}else l=!1;return-1===i?r?"/":".":r&&1===i?"//":e.slice(0,i)},basename:function(e,n){if(void 0!==n&&"string"!=typeof n)throw new TypeError('"ext" argument must be a string');t(e);var r,i=0,l=-1,s=!0;if(void 0!==n&&n.length>0&&n.length<=e.length){if(n.length===e.length&&n===e)return"";var o=n.length-1,a=-1;for(r=e.length-1;r>=0;--r){var u=e.charCodeAt(r);if(47===u){if(!s){i=r+1;break}}else-1===a&&(s=!1,a=r+1),o>=0&&(u===n.charCodeAt(o)?-1==--o&&(l=r):(o=-1,l=a))}return i===l?l=a:-1===l&&(l=e.length),e.slice(i,l)}for(r=e.length-1;r>=0;--r)if(47===e.charCodeAt(r)){if(!s){i=r+1;break}}else-1===l&&(s=!1,l=r+1);return-1===l?"":e.slice(i,l)},extname:function(e){t(e);for(var n=-1,r=0,i=-1,l=!0,s=0,o=e.length-1;o>=0;--o){var a=e.charCodeAt(o);if(47!==a)-1===i&&(l=!1,i=o+1),46===a?-1===n?n=o:1!==s&&(s=1):-1!==n&&(s=-1);else if(!l){r=o+1;break}}return-1===n||-1===i||0===s||1===s&&n===i-1&&n===r+1?"":e.slice(n,i)},format:function(e){if(null===e||"object"!=typeof e)throw new TypeError('The "pathObject" argument must be of type Object. Received type '+typeof e);return function(e,t){var n=t.dir||t.root,r=t.base||(t.name||"")+(t.ext||"");return n?n===t.root?n+r:n+"/"+r:r}(0,e)},parse:function(e){t(e);var n={root:"",dir:"",base:"",ext:"",name:""};if(0===e.length)return n;var r,i=e.charCodeAt(0),l=47===i;l?(n.root="/",r=1):r=0;for(var s=-1,o=0,a=-1,u=!0,c=e.length-1,p=0;c>=r;--c)if(47!==(i=e.charCodeAt(c)))-1===a&&(u=!1,a=c+1),46===i?-1===s?s=c:1!==p&&(p=1):-1!==s&&(p=-1);else if(!u){o=c+1;break}return-1===s||-1===a||0===p||1===p&&s===a-1&&s===o+1?-1!==a&&(n.base=n.name=0===o&&l?e.slice(1,a):e.slice(o,a)):(0===o&&l?(n.name=e.slice(1,s),n.base=e.slice(1,a)):(n.name=e.slice(o,s),n.base=e.slice(o,a)),n.ext=e.slice(s,a)),o>0?n.dir=e.slice(0,o-1):l&&(n.dir="/"),n},sep:"/",delimiter:":",win32:null,posix:null};r.posix=r,re=r}).call(this)}).call(this,Y);var ie={};function le(e,t,n){let r=e.full,i=[],l=t.implictExt||[];if(!r.match(l.join("|")+"$")){for(let e of l)i.push(r+e);for(let e of l)i.push(n(r,"index"+e));if(null!=e.path){let t=(e.path.replace(/[\\\/]+$/,"").match(/[^\\\/]+$/)||[])[0];if(null!=t)for(let e of l)i.push(n(r,"index."+t+e))}}return i}Object.defineProperty(ie,"__esModule",{value:!0}),ie.makeMemResolver=ie.buildPotentials=void 0,ie.makeMemResolver=function(e){return function(t,n,r,i){let l,s=(0,M.resolvePathSpec)(n,i,t,function(e){return function(t){let n=t;return e[t]&&(n=(t.replace(/[\\\/]+$/,"").match(/[\\\/]+([^\\\/]+)$/)||["",""])[1]),n}}(e));if(null!=s.full&&(l=e[s.full],null==l&&M.NONE===s.kind)){let t=le(s,n,(...e)=>e.reduce((e,t)=>e+"/"+t));for(let n of t)if(null!=(l=e[n])){s.full=n,s.kind=(n.match(/\.([^.]*)$/)||[M.NONE,M.NONE])[1];break}}return{...s,src:l,found:null!=l}}},ie.buildPotentials=le;var se={},oe=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(se,"__esModule",{value:!0}),se.makeFileResolver=void 0;const ae=oe(U),ue=oe(re);function ce(e){if("string"!=typeof e)return e;let t=e;return ae.default.statSync(e).isFile()&&(t=ue.default.parse(e).dir),t}function pe(e){try{return ae.default.readFileSync(e).toString()}catch(t){}}se.makeFileResolver=function(e){return function(t,n,r,i){let l,s=e?e(t):t,o=(0,M.resolvePathSpec)(n,i,s,ce),a=[];if(null!=o.full&&(o.full=ue.default.resolve(o.full),a.push(o.full),l=pe(o.full),null==l&&M.NONE===o.kind)){let e=(0,ie.buildPotentials)(o,n,(...e)=>ue.default.resolve(e.reduce((e,t)=>ue.default.join(e,t))));a.push(...e);for(let t of e)if(null!=(l=pe(t))){o.full=t,o.kind=(t.match(/\.([^.]*)$/)||[M.NONE,M.NONE])[1];break}}return{...o,src:l,found:null!=l,search:a}}};var de={},he=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(de,"__esModule",{value:!0}),de.makePkgResolver=void 0;const fe=he(U),me=he(re);function ge(e){if("string"!=typeof e)return e;let t=e;return fe.default.statSync(e).isFile()&&(t=me.default.parse(e).dir),t}function ve(e){try{return fe.default.readFileSync(e).toString()}catch(t){}}de.makePkgResolver=function(e){let t,n=require;return"function"==typeof e.require?n=e.require:Array.isArray(e.require)?t={paths:e.require}:"string"==typeof e.require&&(t={paths:[e.require]}),function(e,r,i,l){let s,o=e,a=(0,M.resolvePathSpec)(r,l,o,ge),u=[];if(null!=a.path)try{a.full=n.resolve(a.path,t),null!=a.full&&(s=ve(a.full),a.kind=(a.full.match(/\.([^.]*)$/)||[M.NONE,M.NONE])[1])}catch(c){u.push(...(null==t?void 0:t.paths)||n.resolve.paths(a.path).map(e=>me.default.join(e,a.path)));let e=(0,ie.buildPotentials)(a,r,(...e)=>me.default.resolve(e.reduce((e,t)=>me.default.join(e,t))));for(let r of e)try{if(a.full=n.resolve(r,t),null!=a.full){s=ve(a.full),a.kind=(a.full.match(/\.([^.]*)$/)||[M.NONE,M.NONE])[1];break}}catch(c){u.push(...(null==t?void 0:t.paths)||n.resolve.paths(r).map(e=>me.default.join(e,r)))}}return{...a,src:s,found:null!=s,search:u}}};var xe={exports:{}};(function(e){(function(){!function(t){"object"==typeof xe.exports?xe.exports=t():("undefined"!=typeof window?window:void 0!==e?e:"undefined"!=typeof self?self:this).JsonicExpr=t()}((function(){var t={exports:{}};(function(e){(function(){!function(n){"object"==typeof t.exports?t.exports=n():("undefined"!=typeof window?window:void 0!==e?e:"undefined"!=typeof self?self:this).Jsonic=n()}((function(){var e=function(e){var t;return function(n){return t||e(t={exports:{},parent:n},t.exports),t.exports}},t=e((function(e,t){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.modlist=t.findTokenSet=t.values=t.keys=t.omap=t.str=t.prop=t.parserwrap=t.trimstk=t.tokenize=t.srcfmt=t.snip=t.regexp=t.mesc=t.makelog=t.isarr=t.filterRules=t.extract=t.escre=t.errinject=t.errdesc=t.entries=t.defprop=t.deep=t.configure=t.clone=t.clean=t.charset=t.badlex=t.assign=t.S=t.JsonicError=void 0;const i=n({}),l=e=>null==e?[]:Object.keys(e);t.keys=l;const s=e=>null==e?[]:Object.values(e);t.values=s;const o=e=>null==e?[]:Object.entries(e);t.entries=o;const a=(e,...t)=>Object.assign(null==e?{}:e,...t);t.assign=a,t.isarr=e=>Array.isArray(e);const u=Object.defineProperty;t.defprop=u;const c=(e,t)=>Object.entries(e||{}).reduce((e,n)=>{let r=t?t(n):n;void 0===r[0]?delete e[n[0]]:e[r[0]]=r[1];let i=2;for(;void 0!==r[i];)e[r[i]]=r[i+1],i+=2;return e},{});t.omap=c;const p={indent:". ",logindent:"  ",space:" ",gap:"  ",Object:"Object",Array:"Array",object:"object",string:"string",function:"function",unexpected:"unexpected",map:"map",list:"list",elem:"elem",pair:"pair",val:"val",node:"node",no_re_flags:r.EMPTY,unprintable:"unprintable",invalid_ascii:"invalid_ascii",invalid_unicode:"invalid_unicode",invalid_lex_state:"invalid_lex_state",unterminated_string:"unterminated_string",unterminated_comment:"unterminated_comment",lex:"lex",parse:"parse",error:"error",none:"none",imp_map:"imp,map",imp_list:"imp,list",imp_null:"imp,null",end:"end",open:"open",close:"close",rule:"rule",stack:"stack",nUll:"null",name:"name",make:"make",colon:":"};t.S=p;class d extends SyntaxError{constructor(e,t,n,r,i){let l=b(e,t=g({},t),n,r,i);super(l.message),a(this,l),x(this)}toJSON(){return{...this,__error:!0,name:this.name,message:this.message,stack:this.stack}}}function h(e,t,n){let i=t.t,l=i[e];return null==l&&r.STRING===typeof e&&(l=t.tI++,i[l]=e,i[e]=l,i[e.substring(1)]=l,null!=n&&a(n.token,t.t)),l}function f(e,...t){return new RegExp(t.map(e=>e.esc?m(e.toString()):e).join(r.EMPTY),null==e?"":e)}function m(e){return null==e?"":e.replace(/[-\\|\]{}()[^$+*?.!=]/g,"\\$&").replace(/\t/g,"\\t").replace(/\r/g,"\\r").replace(/\n/g,"\\n")}function g(e,...t){let n=p.function===typeof e,r=null!=e&&(p.object===typeof e||n);for(let i of t){let t,l=p.function===typeof i,s=null!=i&&(p.object===typeof i||l);if(r&&s&&!l&&Array.isArray(e)===Array.isArray(i))for(let n in i)e[n]=g(e[n],i[n]);else e=void 0===i?e:l?i:s?p.function===typeof(t=i.constructor)&&p.Object!==t.name&&p.Array!==t.name?i:g(Array.isArray(i)?[]:{},i):i,n=p.function===typeof e,r=null!=e&&(p.object===typeof e||n)}return e}function v(e,t,n,r,i,l){let s={code:t,details:n,token:r,rule:i,ctx:l};return null==e?"":e.replace(/\$(\{?)([\w_0-9]+)(\}?)/g,(e,t,o,a)=>{let u=null!=s[o]?s[o]:null!=n[o]?n[o]:l.meta&&null!=l.meta[o]?l.meta[o]:null!=r[o]?r[o]:null!=i[o]?i[o]:null!=l.opts[o]?l.opts[o]:null!=l.cfg[o]?l.cfg[o]:null!=l[o]?l[o]:"$"+o,c=t&&a?u:JSON.stringify(u);return c=null==c?"":c,c.replace(/\n/g,"\n  ")})}function x(e){e.stack&&(e.stack=e.stack.split("\n").filter(e=>!e.includes("jsonic/jsonic")).map(e=>e.replace(/    at /,"at ")).join("\n"))}function k(e,t,n){let i=0<n.sI?n.sI:0,l=0<n.rI?n.rI:1,s=0<n.cI?n.cI:1,o=null==n.src?r.EMPTY:n.src,a=e.substring(Math.max(0,i-333),i).split("\n"),u=e.substring(i,i+333).split("\n"),c=2+(r.EMPTY+(l+2)).length,p=l<3?1:l-2,d=e=>"\x1b[34m"+(r.EMPTY+p++).padStart(c," ")+" | \x1b[0m"+(null==e?r.EMPTY:e),h=a.length;return[2<h?d(a[h-3]):null,1<h?d(a[h-2]):null,d(a[h-1]+u[0])," ".repeat(c)+"   "+" ".repeat(s-1)+"\x1b[31m"+"^".repeat(o.length||1)+" "+t+"\x1b[0m",d(u[1]),d(u[2])].filter(e=>null!=e).join("\n")}function b(e,t,n,r,i){var l,s,o;try{let a=i.cfg,u=i.meta,c=v(a.error[e]||(null===(l=null==t?void 0:t.use)||void 0===l?void 0:l.err)&&(t.use.err.code||t.use.err.message)||a.error.unknown,e,t,n,r,i);p.function===typeof a.hint&&(a.hint={...a.hint(),...a.hint});let d=["\x1b[31m[jsonic/"+e+"]:\x1b[0m "+c,"  \x1b[34m--\x3e\x1b[0m "+(u&&u.fileName||"<no-file>")+":"+n.rI+":"+n.cI,k(i.src(),c,n),"",v((a.hint[e]||(null===(o=null===(s=t.use)||void 0===s?void 0:s.err)||void 0===o?void 0:o.message)||a.hint.unknown||"").trim().split("\n").map(e=>"  "+e).join("\n"),e,t,n,r,i),"","  \x1b[2mhttps://jsonic.senecajs.org\x1b[0m","  \x1b[2m--internal: rule="+r.name+"~"+r.state+"; token="+h(n.tin,i.cfg)+(null==n.why?"":"~"+n.why)+"; plugins="+i.plgn().map(e=>e.name).join(",")+"--\x1b[0m\n"].join("\n"),f={internal:{token:n,ctx:i}};return f={...Object.create(f),message:d,code:e,details:t,meta:u,fileName:u?u.fileName:void 0,lineNumber:n.rI,columnNumber:n.cI},f}catch(a){return console.log(a),{}}}function y(e){return"function"==typeof e.debug.print.src?e.debug.print.src:t=>{let n=null==t?r.EMPTY:Array.isArray(t)?JSON.stringify(t).replace(/]$/,o(t).filter(e=>isNaN(e[0])).map((e,t)=>(0===t?", ":"")+e[0]+": "+JSON.stringify(e[1]))+"]"):JSON.stringify(t);return n=n.substring(0,e.debug.maxlen)+(e.debug.maxlen<n.length?"...":r.EMPTY),n}}function j(e,t=44){let n;try{n="object"==typeof e?JSON.stringify(e):""+e}catch(r){n=""+e}return S(t<n.length?n.substring(0,t-3)+"...":n,t)}function S(e,t=5){return void 0===e?"":(""+e).substring(0,t).replace(/[\r\n\t]/g,".")}function E(...e){return null==e?{}:e.filter(e=>!1!==e).map(e=>"object"==typeof e?l(e).join(r.EMPTY):e).join(r.EMPTY).split(r.EMPTY).reduce((e,t)=>(e[t]=t.charCodeAt(0),e),{})}function O(e){for(let t in e)null==e[t]&&delete e[t];return e}t.JsonicError=d,t.configure=function(e,t,n){var r,i,u,p,d,g,v,x,k,b,y,j,S,N,_,T,w,P,I,M,C,R,A,V,L,D,$,F,Y,J,B,U,K,q,z,G,Z,W,H,X,Q,ee,te,ne,re,ie,le,se,oe,ae;const ue=t||{};ue.t=ue.t||{},ue.tI=ue.tI||1;const ce=e=>h(e,ue);!1!==n.standard$&&(ce("#BD"),ce("#ZZ"),ce("#UK"),ce("#AA"),ce("#SP"),ce("#LN"),ce("#CM"),ce("#NR"),ce("#ST"),ce("#TX"),ce("#VL")),ue.safe={key:!1!==(null===(r=n.safe)||void 0===r?void 0:r.key)},ue.fixed={lex:!!(null===(i=n.fixed)||void 0===i?void 0:i.lex),token:n.fixed?c(O(n.fixed.token),([e,t])=>[t,h(e,ue)]):{},ref:void 0,check:null===(u=n.fixed)||void 0===u?void 0:u.check},ue.fixed.ref=c(ue.fixed.token,([e,t])=>[e,t]),ue.fixed.ref=Object.assign(ue.fixed.ref,c(ue.fixed.ref,([e,t])=>[t,e])),ue.match={lex:!!(null===(p=n.match)||void 0===p?void 0:p.lex),value:n.match?c(O(n.match.value),([e,t])=>[e,t]):{},token:n.match?c(O(n.match.token),([e,t])=>[h(e,ue),t]):{},check:null===(d=n.match)||void 0===d?void 0:d.check},c(ue.match.token,([e,t])=>[e,(t.tin$=+e,t)]);const pe=n.tokenSet?Object.keys(n.tokenSet).reduce((e,t)=>(e[t]=n.tokenSet[t].filter(e=>null!=e).map(e=>ce(e)),e),{}):{};ue.tokenSet=ue.tokenSet||{},o(pe).map(e=>{let t=e[0],n=e[1];ue.tokenSet[t]?(ue.tokenSet[t].length=0,ue.tokenSet[t].push(...n)):ue.tokenSet[t]=n}),ue.tokenSetTins=o(ue.tokenSet).reduce((e,t)=>(e[t[0]]=e[t[0]]||{},t[1].map(n=>e[t[0]][n]=!0),e),{}),ue.tokenSetTins.IGNORE=ue.tokenSetTins.IGNORE||{},ue.space={lex:!!(null===(g=n.space)||void 0===g?void 0:g.lex),chars:E(null===(v=n.space)||void 0===v?void 0:v.chars),check:null===(x=n.space)||void 0===x?void 0:x.check},ue.line={lex:!!(null===(k=n.line)||void 0===k?void 0:k.lex),chars:E(null===(b=n.line)||void 0===b?void 0:b.chars),rowChars:E(null===(y=n.line)||void 0===y?void 0:y.rowChars),single:!!(null===(j=n.line)||void 0===j?void 0:j.single),check:null===(S=n.line)||void 0===S?void 0:S.check},ue.text={lex:!!(null===(N=n.text)||void 0===N?void 0:N.lex),modify:((null===(_=ue.text)||void 0===_?void 0:_.modify)||[]).concat(([null===(T=n.text)||void 0===T?void 0:T.modify]||[]).flat()).filter(e=>null!=e),check:null===(w=n.text)||void 0===w?void 0:w.check},ue.number={lex:!!(null===(P=n.number)||void 0===P?void 0:P.lex),hex:!!(null===(I=n.number)||void 0===I?void 0:I.hex),oct:!!(null===(M=n.number)||void 0===M?void 0:M.oct),bin:!!(null===(C=n.number)||void 0===C?void 0:C.bin),sep:null!=(null===(R=n.number)||void 0===R?void 0:R.sep)&&""!==n.number.sep,exclude:null===(A=n.number)||void 0===A?void 0:A.exclude,sepChar:null===(V=n.number)||void 0===V?void 0:V.sep,check:null===(L=n.number)||void 0===L?void 0:L.check},ue.value={lex:!!(null===(D=n.value)||void 0===D?void 0:D.lex),def:o((null===($=n.value)||void 0===$?void 0:$.def)||{}).reduce((e,t)=>(null==t[1]||!1===t[1]||t[1].match||(e[t[0]]=t[1]),e),{}),defre:o((null===(F=n.value)||void 0===F?void 0:F.def)||{}).reduce((e,t)=>(t[1]&&t[1].match&&(e[t[0]]=t[1],e[t[0]].consume=!!e[t[0]].consume),e),{})},ue.rule={start:null==(null===(Y=n.rule)||void 0===Y?void 0:Y.start)?"val":n.rule.start,maxmul:null==(null===(J=n.rule)||void 0===J?void 0:J.maxmul)?3:n.rule.maxmul,finish:!!(null===(B=n.rule)||void 0===B?void 0:B.finish),include:(null===(U=n.rule)||void 0===U?void 0:U.include)?n.rule.include.split(/\s*,+\s*/).filter(e=>""!==e):[],exclude:(null===(K=n.rule)||void 0===K?void 0:K.exclude)?n.rule.exclude.split(/\s*,+\s*/).filter(e=>""!==e):[]},ue.map={extend:!!(null===(q=n.map)||void 0===q?void 0:q.extend),merge:null===(z=n.map)||void 0===z?void 0:z.merge},ue.list={property:!!(null===(G=n.list)||void 0===G?void 0:G.property)};let de=Object.keys(ue.fixed.token).sort((e,t)=>t.length-e.length).map(e=>m(e)).join("|"),he=(null===(Z=n.comment)||void 0===Z?void 0:Z.lex)?(n.comment.def?s(n.comment.def):[]).filter(e=>e&&e.lex).map(e=>m(e.start)).join("|"):"",fe=["([",m(l(E(ue.space.lex&&ue.space.chars,ue.line.lex&&ue.line.chars)).join("")),"]",("string"==typeof n.ender?n.ender.split(""):Array.isArray(n.ender)?n.ender:[]).map(e=>"|"+m(e)).join(""),""===de?"":"|",de,""===he?"":"|",he,"|$)"];return ue.rePart={fixed:de,ender:fe,commentStart:he},ue.re={ender:f(null,...fe),rowChars:f(null,m(null===(W=n.line)||void 0===W?void 0:W.rowChars)),columns:f(null,"["+m(null===(H=n.line)||void 0===H?void 0:H.chars)+"]","(.*)$")},ue.lex={empty:!!(null===(X=n.lex)||void 0===X?void 0:X.empty),emptyResult:null===(Q=n.lex)||void 0===Q?void 0:Q.emptyResult,match:(null===(ee=n.lex)||void 0===ee?void 0:ee.match)?o(n.lex.match).reduce((e,t)=>{let r=t[0],i=t[1];if(i){let t=i.make(ue,n);t&&(t.matcher=r,t.make=i.make,t.order=i.order),e.push(t)}return e},[]).filter(e=>null!=e&&!1!==e&&-1<+e.order).sort((e,t)=>e.order-t.order):[]},ue.parse={prepare:s(null===(te=n.parse)||void 0===te?void 0:te.prepare)},ue.debug={get_console:(null===(ne=n.debug)||void 0===ne?void 0:ne.get_console)||(()=>console),maxlen:null==(null===(re=n.debug)||void 0===re?void 0:re.maxlen)?99:n.debug.maxlen,print:{config:!!(null===(le=null===(ie=n.debug)||void 0===ie?void 0:ie.print)||void 0===le?void 0:le.config),src:null===(oe=null===(se=n.debug)||void 0===se?void 0:se.print)||void 0===oe?void 0:oe.src}},ue.error=n.error||{},ue.hint=n.hint||{},(null===(ae=n.config)||void 0===ae?void 0:ae.modify)&&l(n.config.modify).forEach(e=>n.config.modify[e](ue,n)),ue.debug.print.config&&ue.debug.get_console().dir(ue,{depth:null}),ue.result={fail:[]},n.result&&(ue.result.fail=[...n.result.fail]),a(e.options,n),a(e.token,ue.t),a(e.tokenSet,ue.tokenSet),a(e.fixed,ue.fixed.ref),ue},t.tokenize=h,t.findTokenSet=function(e,t){return t.tokenSet[e]},t.mesc=function(e,t){return(t=new String(e)).esc=!0,t},t.regexp=f,t.escre=m,t.deep=g,t.errinject=v,t.trimstk=x,t.extract=k,t.errdesc=b,t.badlex=function(e,t,n){let r=e.next.bind(e);return e.next=(e,i,l,s)=>{let o=r(e,i,l,s);if(t===o.tin){let t={};throw null!=o.use&&(t.use=o.use),new d(o.why||p.unexpected,t,o,e,n)}return o},e},t.makelog=function(e,t){var n,r,i;let l=null===(i=null===(r=null===(n=e.opts)||void 0===n?void 0:n.plugin)||void 0===r?void 0:r.debug)||void 0===i?void 0:i.trace;if(t||l)if("number"==typeof(null==t?void 0:t.log)||l){let n=!1,r=null==t?void 0:t.log;(-1===r||l)&&(r=1,n=!0),e.log=(...t)=>{if(n){let n=t.filter(e=>p.object!=typeof e).map(e=>p.function==typeof e?e.name:e).join(p.gap);e.cfg.debug.get_console().log(n)}else e.cfg.debug.get_console().dir(t,{depth:r})}}else"function"==typeof t.log&&(e.log=t.log);return e.log},t.srcfmt=y,t.str=j,t.snip=S,t.clone=function(e){return g(Object.create(Object.getPrototypeOf(e)),e)},t.charset=E,t.clean=O,t.filterRules=function(e,t){let n=["open","close"];for(let r of n)e.def[r]=e.def[r].map(e=>(e.g="string"==typeof e.g?(e.g||"").split(/\s*,+\s*/):e.g||[],e)).filter(e=>t.rule.include.reduce((t,n)=>t||null!=e.g&&-1!==e.g.indexOf(n),0===t.rule.include.length)).filter(e=>t.rule.exclude.reduce((t,n)=>t&&(null==e.g||-1===e.g.indexOf(n)),!0));return e},t.prop=function(e,t,n){let r=e;try{let r,i=t.split(".");for(let t=0;t<i.length;t++)r=i[t],t<i.length-1&&(e=e[r]=e[r]||{});return void 0!==n&&(e[r]=n),e[r]}catch(i){throw new Error("Cannot "+(void 0===n?"get":"set")+" path "+t+" on object: "+j(r)+(void 0===n?"":" to value: "+j(n,22)))}},t.modlist=function(e,t){if(t&&e){if(0<e.length){if(t.delete&&0<t.delete.length)for(let r=0;r<t.delete.length;r++){let n=t.delete[r];(n<0?-1*n<=e.length:n<e.length)&&(e[(e.length+n)%e.length]=null)}if(t.move)for(let r=0;r<t.move.length;r+=2){let n=(e.length+t.move[r])%e.length,i=(e.length+t.move[r+1])%e.length,l=e[n];e.splice(n,1),e.splice(i,0,l)}let n=e.filter(e=>null!=e);n.length!==e.length&&(e.length=0,e.push(...n))}if(t.custom){let n=t.custom(e);null!=n&&(e=n)}}return e},t.parserwrap=function(e){return{start:function(t,n,l,s){try{return e.start(t,n,l,s)}catch(o){if("SyntaxError"===o.name){let s=0,a=0,u=0,c=r.EMPTY,p=o.message.match(/^Unexpected token (.) .*position\s+(\d+)/i);if(p){c=p[1],s=parseInt(p[2]),a=t.substring(0,s).replace(/[^\n]/g,r.EMPTY).length;let e=s-1;for(;-1<e&&"\n"!==t.charAt(e);)e--;u=Math.max(t.substring(e,s).length,0)}let f=o.token||(0,i.makeToken)("#UK",h("#UK",n.internal().config),void 0,c,(0,i.makePoint)(c.length,s,o.lineNumber||a,o.columnNumber||u));throw new d(o.code||"json",o.details||{msg:o.message},f,{},o.ctx||{uI:-1,opts:n.options,cfg:n.internal().config,token:f,meta:l,src:()=>t,root:()=>{},plgn:()=>n.internal().plugins,inst:()=>n,rule:{name:"no-rule"},sub:{},xs:-1,v2:f,v1:f,t0:f,t1:f,tC:-1,kI:-1,rs:[],rsI:0,rsm:{},n:{},log:l?l.log:void 0,F:y(n.internal().config),use:{},NORULE:{name:"no-rule"},NOTOKEN:{name:"no-token"}})}throw o}}}}})),n=e((function(e,n){"use strict";Object.defineProperty(n,"__esModule",{value:!0}),n.makeTextMatcher=n.makeNumberMatcher=n.makeCommentMatcher=n.makeStringMatcher=n.makeLineMatcher=n.makeSpaceMatcher=n.makeFixedMatcher=n.makeMatchMatcher=n.makeToken=n.makePoint=n.makeLex=n.makeNoToken=void 0;const i=t({});class l{constructor(e,t,n,r){this.len=-1,this.sI=0,this.rI=1,this.cI=1,this.token=[],this.len=e,null!=t&&(this.sI=t),null!=n&&(this.rI=n),null!=r&&(this.cI=r)}toString(){return"Point["+[this.sI+"/"+this.len,this.rI,this.cI]+(0<this.token.length?" "+this.token:"")+"]"}[r.INSPECT](){return this.toString()}}const s=(...e)=>new l(...e);n.makePoint=s;class o{constructor(e,t,n,i,l,s,o){this.isToken=!0,this.name=r.EMPTY,this.tin=-1,this.val=void 0,this.src=r.EMPTY,this.sI=-1,this.rI=-1,this.cI=-1,this.len=-1,this.name=e,this.tin=t,this.src=i,this.val=n,this.sI=l.sI,this.rI=l.rI,this.cI=l.cI,this.use=s,this.why=o,this.len=null==i?0:i.length}resolveVal(e,t){return"function"==typeof this.val?this.val(e,t):this.val}bad(e,t){return this.err=e,null!=t&&(this.use=(0,i.deep)(this.use||{},t)),this}toString(){return"Token["+this.name+"="+this.tin+" "+(0,i.snip)(this.src)+(void 0===this.val||"#ST"===this.name||"#TX"===this.name?"":"="+(0,i.snip)(this.val))+" "+[this.sI,this.rI,this.cI]+(null==this.use?"":" "+(0,i.snip)(""+JSON.stringify(this.use).replace(/"/g,""),22))+(null==this.err?"":" "+this.err)+(null==this.why?"":" "+(0,i.snip)(""+this.why,22))+"]"}[r.INSPECT](){return this.toString()}}const a=(...e)=>new o(...e);function u(e,t,n){let r=e.pnt,i=t;if(e.cfg.fixed.lex&&null!=n&&0<n.length){let l,s=e.cfg.fixed.token[n];null!=s&&(l=e.token(s,void 0,n,r)),null!=l&&(r.sI+=l.src.length,r.cI+=l.src.length,null==t?i=l:r.token.push(l))}return i}n.makeToken=a,n.makeNoToken=()=>a("",-1,void 0,r.EMPTY,s(-1)),n.makeFixedMatcher=(e,t)=>{let n=(0,i.regexp)(null,"^(",e.rePart.fixed,")");return function(t){let r=e.fixed;if(!r.lex)return;if(e.fixed.check){let n=e.fixed.check(t);if(n&&n.done)return n.token}let i=t.pnt,l=t.src.substring(i.sI).match(n);if(l){let e=l[1],n=e.length;if(0<n){let l,s=r.token[e];return null!=s&&(l=t.token(s,void 0,e,i),i.sI+=n,i.cI+=n),l}}}},n.makeMatchMatcher=(e,t)=>{let n=(0,i.values)(e.match.value),r=(0,i.values)(e.match.token);return 0===n.length&&0===r.length?null:function(t,i,l=0){if(!e.match.lex)return;if(e.match.check){let n=e.match.check(t);if(n&&n.done)return n.token}let s=t.pnt,o=t.src.substring(s.sI),a="o"===i.state?0:1;for(let e of n)if(e.match instanceof RegExp){let n=o.match(e.match);if(n){let r=n[0],i=r.length;if(0<i){let l,o=e.val?e.val(n):r;return l=t.token("#VL",o,r,s),s.sI+=i,s.cI+=i,l}}}else{let n=e.match(t,i);if(null!=n)return n}for(let e of r)if(!e.tin$||i.spec.def.tcol[a][l].includes(e.tin$))if(e instanceof RegExp){let n=o.match(e);if(n){let r=n[0],i=r.length;if(0<i){let n,l=e.tin$;return n=t.token(l,r,r,s),s.sI+=i,s.cI+=i,n}}}else{let n=e(t,i);if(null!=n)return n}}},n.makeCommentMatcher=(e,t)=>{let n=t.comment;e.comment={lex:!!n&&!!n.lex,def:((null==n?void 0:n.def)?(0,i.entries)(n.def):[]).reduce((e,[t,n])=>{if(null==n||!1===n)return e;let r={name:t,start:n.start,end:n.end,line:!!n.line,lex:!!n.lex,eatline:!!n.eatline};return e[t]=r,e},{})};let r=e.comment.lex?(0,i.values)(e.comment.def).filter(e=>e.lex&&e.line):[],l=e.comment.lex?(0,i.values)(e.comment.def).filter(e=>e.lex&&!e.line):[];return function(t,n){if(!e.comment.lex)return;if(e.comment.check){let n=e.comment.check(t);if(n&&n.done)return n.token}let s=t.pnt,o=t.src.substring(s.sI),a=s.rI,u=s.cI;for(let i of r)if(o.startsWith(i.start)){let n=o.length,r=i.start.length;for(u+=i.start.length;r<n&&!e.line.chars[o[r]];)u++,r++;if(i.eatline)for(;r<n&&e.line.chars[o[r]];)e.line.rowChars[o[r]]&&a++,r++;let l=o.substring(0,r),c=t.token("#CM",void 0,l,s);return s.sI+=l.length,s.cI=u,s.rI=a,c}for(let r of l)if(o.startsWith(r.start)){let n=o.length,l=r.start.length,c=r.end;for(u+=r.start.length;l<n&&!o.substring(l).startsWith(c);)e.line.rowChars[o[l]]&&(a++,u=0),u++,l++;if(o.substring(l).startsWith(c)){if(u+=c.length,r.eatline)for(;l<n&&e.line.chars[o[l]];)e.line.rowChars[o[l]]&&a++,l++;let i=o.substring(0,l+c.length),p=t.token("#CM",void 0,i,s);return s.sI+=i.length,s.rI=a,s.cI=u,p}return t.bad(i.S.unterminated_comment,s.sI,s.sI+9*r.start.length)}}},n.makeTextMatcher=(e,t)=>{let n=(0,i.regexp)(e.line.lex?null:"s","^(.*?)",...e.rePart.ender);return function(r){if(e.text.check){let t=e.text.check(r);if(t&&t.done)return t.token}let i=e.text,l=r.pnt,s=r.src.substring(l.sI),o=e.value.def,a=e.value.defre,c=s.match(n);if(c){let n,p=c[1],d=c[2];if(null!=p){let t=p.length;if(0<t){let u;if(e.value.lex)if(void 0!==(u=o[p]))n=r.token("#VL",u.val,p,l),l.sI+=t,l.cI+=t;else for(let e in a){let t=a[e];if(t.match){let e=t.match.exec(t.consume?s:p);if(e&&(t.consume||e[0].length===p.length)){let i=e[0];if(null==t.val)n=r.token("#VL",i,i,l);else{let s=t.val(e);n=r.token("#VL",s,i,l)}l.sI+=i.length,l.cI+=i.length}}}null==n&&i.lex&&(n=r.token("#TX",p,p,l),l.sI+=t,l.cI+=t)}}if(n&&(n=u(r,n,d)),n&&0<e.text.modify.length){const i=e.text.modify;for(let l=0;l<i.length;l++)n.val=i[l](n.val,r,e,t)}return n}}},n.makeNumberMatcher=(e,t)=>{let n=e.number,r=(0,i.regexp)(null,["^([-+]?(0(",[n.hex?"x[0-9a-fA-F_]+":null,n.oct?"o[0-7_]+":null,n.bin?"b[01_]+":null].filter(e=>null!=e).join("|"),")|\\.?[0-9]+([0-9_]*[0-9])?)","(\\.[0-9]?([0-9_]*[0-9])?)?","([eE][-+]?[0-9]+([0-9_]*[0-9])?)?"].join("").replace(/_/g,n.sep?(0,i.escre)(n.sepChar):""),")",...e.rePart.ender),l=n.sep?(0,i.regexp)("g",(0,i.escre)(n.sepChar)):void 0;return function(t){if(n=e.number,!n.lex)return;if(e.number.check){let n=e.number.check(t);if(n&&n.done)return n.token}let i=t.pnt,s=t.src.substring(i.sI),o=e.value.def,a=s.match(r);if(a){let n,r=a[1],s=a[9],c=!0;if(null!=r&&(c=!e.number.exclude||!r.match(e.number.exclude))){let s=r.length;if(0<s){let a;if(e.value.lex&&void 0!==(a=o[r]))n=t.token("#VL",a.val,r,i);else{let e=l?r.replace(l,""):r,o=+e;if(isNaN(o)){let t=e[0];"-"!==t&&"+"!==t||(o=("-"===t?-1:1)*+e.substring(1))}isNaN(o)||(n=t.token("#NR",o,r,i),i.sI+=s,i.cI+=s)}}}return c&&(n=u(t,n,s)),n}}},n.makeStringMatcher=(e,t)=>{let n=t.string||{};return e.string=e.string||{},e.string=(0,i.deep)(e.string,{lex:!!(null==n?void 0:n.lex),quoteMap:(0,i.charset)(n.chars),multiChars:(0,i.charset)(n.multiChars),escMap:{...n.escape},escChar:n.escapeChar,escCharCode:null==n.escapeChar?void 0:n.escapeChar.charCodeAt(0),allowUnknown:!!n.allowUnknown,replaceCodeMap:(0,i.omap)((0,i.clean)({...n.replace}),([e,t])=>[e.charCodeAt(0),t]),hasReplace:!1,abandon:!!n.abandon}),e.string.escMap=(0,i.clean)(e.string.escMap),e.string.hasReplace=0<(0,i.keys)(e.string.replaceCodeMap).length,function(t){let n=e.string;if(!n.lex)return;if(e.string.check){let n=e.string.check(t);if(n&&n.done)return n.token}let{quoteMap:l,escMap:s,escChar:o,escCharCode:a,multiChars:u,allowUnknown:c,replaceCodeMap:p,hasReplace:d}=n,{pnt:h,src:f}=t,{sI:m,rI:g,cI:v}=h,x=f.length;if(l[f[m]]){const l=f[m],k=m,b=g,y=u[l];++m,++v;let j,S=[];for(;m<x;m++){v++;let r=f[m];if(j=void 0,l===r){m++;break}if(o===r){m++,v++;let e=s[f[m]];if(null!=e)S.push(e);else if("x"===f[m]){m++;let e=parseInt(f.substring(m,m+2),16);if(isNaN(e)){if(n.abandon)return;return m-=2,v-=2,h.sI=m,h.cI=v,t.bad(i.S.invalid_ascii,m,m+4)}let r=String.fromCharCode(e);S.push(r),m+=1,v+=2}else if("u"===f[m]){m++;let e="{"===f[m]?(m++,1):0,r=e?6:4,l=parseInt(f.substring(m,m+r),16);if(isNaN(l)){if(n.abandon)return;return m=m-2-e,v-=2,h.sI=m,h.cI=v,t.bad(i.S.invalid_unicode,m,m+r+2+2*e)}let s=String.fromCodePoint(l);S.push(s),m+=r-1+e,v+=r+e}else{if(!c){if(n.abandon)return;return h.sI=m,h.cI=v-1,t.bad(i.S.unexpected,m,m+1)}S.push(f[m])}}else if(d&&void 0!==(j=p[f.charCodeAt(m)]))S.push(j),v++;else{let r=m,s=l.charCodeAt(0),o=f.charCodeAt(m);for(;(!d||void 0===(j=p[o]))&&m<x&&32<=o&&s!==o&&a!==o;)o=f.charCodeAt(++m),v++;if(v--,void 0===j&&o<32){if(!y||!e.line.chars[f[m]]){if(n.abandon)return;return h.sI=m,h.cI=v,t.bad(i.S.unprintable,m,m+1)}e.line.rowChars[f[m]]&&(h.rI=++g),v=1,S.push(f.substring(r,m+1))}else S.push(f.substring(r,m)),m--}}if(f[m-1]!==l||h.sI===m-1){if(n.abandon)return;return h.rI=b,t.bad(i.S.unterminated_string,k,m)}const E=t.token("#ST",S.join(r.EMPTY),f.substring(h.sI,m),h);return h.sI=m,h.rI=g,h.cI=v,E}}},n.makeLineMatcher=(e,t)=>function(t){if(!e.line.lex)return;if(e.line.check){let n=e.line.check(t);if(n&&n.done)return n.token}let n,{chars:r,rowChars:i}=e.line,{pnt:l,src:s}=t,{sI:o,rI:a}=l,u=e.line.single;for(u&&(n={});r[s[o]]&&!(n&&(n[s[o]]=(n[s[o]]||0)+1,u&&1<n[s[o]]));)a+=i[s[o]]?1:0,o++;if(l.sI<o){let e=s.substring(l.sI,o);const n=t.token("#LN",void 0,e,l);return l.sI+=e.length,l.rI=a,l.cI=1,n}},n.makeSpaceMatcher=(e,t)=>function(t){if(!e.space.lex)return;if(e.space.check){let n=e.space.check(t);if(n&&n.done)return n.token}let{chars:n}=e.space,{pnt:r,src:i}=t,{sI:l,cI:s}=r;for(;n[i[l]];)l++,s++;if(r.sI<l){let e=i.substring(r.sI,l);const n=t.token("#SP",void 0,e,r);return r.sI+=e.length,r.cI=s,n}};class c{constructor(e){this.src=r.EMPTY,this.ctx={},this.cfg={},this.pnt=s(-1),this.ctx=e,this.src=e.src(),this.cfg=e.cfg,this.pnt=s(this.src.length)}token(e,t,n,r,l,s){let o,u;return"string"==typeof e?(u=e,o=(0,i.tokenize)(u,this.cfg)):(o=e,u=(0,i.tokenize)(e,this.cfg)),a(u,o,t,n,r||this.pnt,l,s)}next(e,t,n,r){let l,s,o=this.pnt,a=o.sI;if(o.end)l=o.end;else if(0<o.token.length)l=o.token.shift();else if(o.len<=o.sI)o.end=this.token("#ZZ",void 0,"",o),l=o.end;else{try{for(let t of this.cfg.lex.match)if(l=t(this,e,r)){s=t;break}}catch(u){l=l||this.token("#BD",void 0,this.src[o.sI],o,{err:u},u.code||i.S.unexpected)}l=l||this.token("#BD",void 0,this.src[o.sI],o,void 0,i.S.unexpected)}return this.ctx.log&&this.ctx.log(i.S.lex,this.ctx,e,this,o,a,s,l,t,n,r),this.ctx.sub.lex&&this.ctx.sub.lex.map(t=>t(l,e,this.ctx)),l}tokenize(e){return(0,i.tokenize)(e,this.cfg)}bad(e,t,n){return this.token("#BD",void 0,0<=t&&t<=n?this.src.substring(t,n):this.src[this.pnt.sI],void 0,void 0,e)}}n.makeLex=(...e)=>new c(...e)})),r={};Object.defineProperty(r,"__esModule",{value:!0}),r.STRING=r.INSPECT=r.EMPTY=r.AFTER=r.BEFORE=r.CLOSE=r.OPEN=void 0,r.OPEN="o",r.CLOSE="c",r.BEFORE="b",r.AFTER="a",r.EMPTY="",r.INSPECT=Symbol.for("nodejs.util.inspect.custom"),r.STRING="string";var i={};Object.defineProperty(i,"__esModule",{value:!0}),i.defaults=void 0;const l=n({}),s={safe:{key:!0},tag:"-",fixed:{lex:!0,token:{"#OB":"{","#CB":"}","#OS":"[","#CS":"]","#CL":":","#CA":","}},match:{lex:!0,token:{}},tokenSet:{IGNORE:["#SP","#LN","#CM"],VAL:["#TX","#NR","#ST","#VL"],KEY:["#TX","#NR","#ST","#VL"]},space:{lex:!0,chars:" \t"},line:{lex:!0,chars:"\r\n",rowChars:"\n",single:!1},text:{lex:!0},number:{lex:!0,hex:!0,oct:!0,bin:!0,sep:"_",exclude:void 0},comment:{lex:!0,def:{hash:{line:!0,start:"#",lex:!0,eatline:!1},slash:{line:!0,start:"//",lex:!0,eatline:!1},multi:{line:!1,start:"/*",end:"*/",lex:!0,eatline:!1}}},string:{lex:!0,chars:"'\"`",multiChars:"`",escapeChar:"\\",escape:{b:"\b",f:"\f",n:"\n",r:"\r",t:"\t",v:"\v",'"':'"',"'":"'","`":"`","\\":"\\","/":"/"},allowUnknown:!0,abandon:!1},map:{extend:!0,merge:void 0},list:{property:!0},value:{lex:!0,def:{true:{val:!0},false:{val:!1},null:{val:null}}},ender:[],plugin:{},debug:{get_console:()=>console,maxlen:99,print:{config:!1,src:void 0}},error:{unknown:"unknown error: $code",unexpected:"unexpected character(s): $src",invalid_unicode:"invalid unicode escape: $src",invalid_ascii:"invalid ascii escape: $src",unprintable:"unprintable character: $src",unterminated_string:"unterminated string: $src",unterminated_comment:"unterminated comment: $src",unknown_rule:"unknown rule: $rulename"},hint:function(e=((e,t="replace")=>e[t](/[A-Z]/g,e=>" "+e.toLowerCase())[t](/[~%][a-z]/g,e=>("~"==e[0]?" ":"")+e[1].toUpperCase())),t="~sinceTheErrorIsUnknown,ThisIsProbablyABugInsideJsonic\nitself,OrAPlugin.~pleaseConsiderPostingAGithubIssue -Thanks!\n\n~code: $code,~details: \n$details|~theCharacter(s) $srcWereNotExpectedAtThisPointAsTheyDoNot\nmatchTheExpectedSyntax,EvenUnderTheRelaxedJsonicRules.~ifIt\nisNotObviouslyWrong,TheActualSyntaxErrorMayBeElsewhere.~try\ncommentingOutLargerAreasAroundThisPointUntilYouGetNoErrors,\nthenRemoveTheCommentsInSmallSectionsUntilYouFindThe\noffendingSyntax.~n%o%t%e:~alsoCheckIfAnyPluginsYouAreUsing\nexpectDifferentSyntaxInThisCase.|~theEscapeSequence $srcDoesNotEncodeAValidUnicodeCodePoint\nnumber.~youMayNeedToValidateYourStringDataManuallyUsingTest\ncodeToSeeHow~javaScriptWillInterpretIt.~alsoConsiderThatYour\ndataMayHaveBecomeCorrupted,OrTheEscapeSequenceHasNotBeen\ngeneratedCorrectly.|~theEscapeSequence $srcDoesNotEncodeAValid~a%s%c%i%iCharacter.~you\nmayNeedToValidateYourStringDataManuallyUsingTestCodeToSee\nhow~javaScriptWillInterpretIt.~alsoConsiderThatYourDataMay\nhaveBecomeCorrupted,OrTheEscapeSequenceHasNotBeenGenerated\ncorrectly.|~stringValuesCannotContainUnprintableCharacters (characterCodes\nbelow 32).~theCharacter $srcIsUnprintable.~youMayNeedToRemove\ntheseCharactersFromYourSourceData.~alsoCheckThatItHasNot\nbecomeCorrupted.|~thisStringHasNoEndQuote.|~thisCommentIsNeverClosed.|~noRuleNamed $rulenameIsDefined.~thisIsProbablyAnErrorInThe\ngrammarOfAPlugin.".split("|")){return"unknown|unexpected|invalid_unicode|invalid_ascii|unprintable|unterminated_string|unterminated_comment|unknown_rule".split("|").reduce((n,r,i)=>(n[r]=e(t[i]),n),{})},lex:{match:{match:{order:1e6,make:l.makeMatchMatcher},fixed:{order:2e6,make:l.makeFixedMatcher},space:{order:3e6,make:l.makeSpaceMatcher},line:{order:4e6,make:l.makeLineMatcher},string:{order:5e6,make:l.makeStringMatcher},comment:{order:6e6,make:l.makeCommentMatcher},number:{order:7e6,make:l.makeNumberMatcher},text:{order:8e6,make:l.makeTextMatcher}},empty:!0,emptyResult:void 0},parse:{prepare:{}},rule:{start:"val",finish:!0,maxmul:3,include:"",exclude:""},result:{fail:[]},config:{modify:{}},parser:{start:void 0}};i.defaults=s;var o={};Object.defineProperty(o,"__esModule",{value:!0}),o.makeRuleSpec=o.makeNoRule=o.makeRule=void 0;const a=t({});class u{constructor(e,t,n){this.i=-1,this.name=r.EMPTY,this.node=null,this.state=r.OPEN,this.n=Object.create(null),this.d=-1,this.u=Object.create(null),this.k=Object.create(null),this.bo=!1,this.ao=!1,this.bc=!1,this.ac=!1,this.os=0,this.cs=0,this.need=0,this.i=t.uI++,this.name=e.name,this.spec=e,this.child=t.NORULE,this.parent=t.NORULE,this.prev=t.NORULE,this.o0=t.NOTOKEN,this.o1=t.NOTOKEN,this.c0=t.NOTOKEN,this.c1=t.NOTOKEN,this.node=n,this.d=t.rsI,this.bo=null!=e.def.bo,this.ao=null!=e.def.ao,this.bc=null!=e.def.bc,this.ac=null!=e.def.ac}process(e,t){return this.spec.process(this,e,t,this.state)}eq(e,t=0){let n=this.n[e];return null==n||n===t}lt(e,t=0){let n=this.n[e];return null==n||n<t}gt(e,t=0){let n=this.n[e];return null==n||n>t}lte(e,t=0){let n=this.n[e];return null==n||n<=t}gte(e,t=0){let n=this.n[e];return null==n||n>=t}toString(){return"[Rule "+this.name+"~"+this.i+"]"}}const c=(...e)=>new u(...e);o.makeRule=c,o.makeNoRule=e=>c(g(e.cfg,{}),e);class p{constructor(){this.p=r.EMPTY,this.r=r.EMPTY,this.b=0}}const d=(...e)=>new p(...e),h=d(),f=d();class m{constructor(e,t){this.name=r.EMPTY,this.def={open:[],close:[],bo:[],bc:[],ao:[],ac:[],tcol:[]},this.cfg=e,this.def=Object.assign(this.def,t),this.def.open=(this.def.open||[]).filter(e=>null!=e),this.def.close=(this.def.close||[]).filter(e=>null!=e);for(let n of[...this.def.open,...this.def.close])v(n)}tin(e){return(0,a.tokenize)(e,this.cfg)}add(e,t,n){let r=(null==n?void 0:n.append)?"push":"unshift",i=((0,a.isarr)(t)?t:[t]).filter(e=>null!=e&&"object"==typeof e).map(e=>v(e)),l="o"===e?"open":"close",s=this.def[l];return s[r](...i),s=this.def[l]=(0,a.modlist)(s,n),(0,a.filterRules)(this,this.cfg),this.norm(),this}open(e,t){return this.add("o",e,t)}close(e,t){return this.add("c",e,t)}action(e,t,n,r){let i=this.def[t+n];return e?i.push(r):i.unshift(r),this}bo(e,t){return this.action(!t||!!e,r.BEFORE,r.OPEN,t||e)}ao(e,t){return this.action(!t||!!e,r.AFTER,r.OPEN,t||e)}bc(e,t){return this.action(!t||!!e,r.BEFORE,r.CLOSE,t||e)}ac(e,t){return this.action(!t||!!e,r.AFTER,r.CLOSE,t||e)}clear(){return this.def.open.length=0,this.def.close.length=0,this.def.bo.length=0,this.def.ao.length=0,this.def.bc.length=0,this.def.ac.length=0,this}norm(){this.def.open.map(e=>v(e)),this.def.close.map(e=>v(e));const e=[];function t(e,t,n){return n[e]=n[e]||[],[function(e,n){if(n.s&&n.s[t]){let r=[...new Set(e.concat(n.s[t]))];e.length=0,e.push(...r)}return e},n[e][t]=n[e][t]||[]]}return this.def.open.reduce(...t(0,0,e)),this.def.open.reduce(...t(0,1,e)),this.def.close.reduce(...t(1,0,e)),this.def.close.reduce(...t(1,1,e)),this.def.tcol=e,this}process(e,t,n,i){t.log&&t.log(a.S.rule,t,e,n);let l="o"===i,s=l?e:t.NORULE,o=l?"O":"C",u=this.def,p=l?u.open:u.close,d=l?e.bo?u.bo:null:e.bc?u.bc:null;if(d){let n;for(let r=0;r<d.length;r++)if(n=d[r].call(this,e,t,s,n),(null==n?void 0:n.isToken)&&(null==n?void 0:n.err))return this.bad(n,e,t,{is_open:l})}let m=0<p.length?function(e,t,n,i,l){let s=h;s.b=0,s.p=r.EMPTY,s.r=r.EMPTY,s.n=void 0,s.h=void 0,s.a=void 0,s.u=void 0,s.k=void 0,s.e=void 0;let o=null,u=0,c=!0,p=1<<l.cfg.t.AA-1,d=l.cfg.tokenSetTins.IGNORE;function f(e,t,r,i){let s;do{s=n.next(e,t,r,i),l.tC++}while(d[s.tin]);return s}let m=t.length;for(u=0;u<m;u++){o=t[u];let n=!1,r=!1;if(c=!0,o.S0){let e=(l.t0=l.NOTOKEN!==l.t0?l.t0:l.t0=f(i,o,u,0)).tin;if(n=!0,c=!!(o.S0[e/31|0]&(1<<e%31-1|p)),c&&(r=null!=o.S1,o.S1)){let e=(l.t1=l.NOTOKEN!==l.t1?l.t1:l.t1=f(i,o,u,1)).tin;r=!0,c=!!(o.S1[e/31|0]&(1<<e%31-1|p))}}if(e?(i.o0=n?l.t0:l.NOTOKEN,i.o1=r?l.t1:l.NOTOKEN,i.os=(n?1:0)+(r?1:0)):(i.c0=n?l.t0:l.NOTOKEN,i.c1=r?l.t1:l.NOTOKEN,i.cs=(n?1:0)+(r?1:0)),c&&o.c&&(c=c&&o.c(i,l,s)),c)break;o=null}c||(s.e=l.t0),o&&(s.n=null!=o.n?o.n:s.n,s.h=null!=o.h?o.h:s.h,s.a=null!=o.a?o.a:s.a,s.u=null!=o.u?o.u:s.u,s.k=null!=o.k?o.k:s.k,s.g=null!=o.g?o.g:s.g,s.e=o.e&&o.e(i,l,s)||void 0,s.p=null!=o.p&&!1!==o.p?"string"==typeof o.p?o.p:o.p(i,l,s):s.p,s.r=null!=o.r&&!1!==o.r?"string"==typeof o.r?o.r:o.r(i,l,s):s.r,s.b=null!=o.b&&!1!==o.b?"number"==typeof o.b?o.b:o.b(i,l,s):s.b);let g=u<t.length;return l.log&&l.log(a.S.parse,l,i,n,g,c,u,o,s),s}(l,p,n,e,t):f;if(m.h&&(m=m.h(e,t,m,s)||m,o+="H"),m.e)return this.bad(m.e,e,t,{is_open:l});if(m.n)for(let r in m.n)e.n[r]=0===m.n[r]?0:(null==e.n[r]?0:e.n[r])+m.n[r];if(m.u&&(e.u=Object.assign(e.u,m.u)),m.k&&(e.k=Object.assign(e.k,m.k)),m.a){o+="A";let n=m.a(e,t,m);if(n&&n.isToken&&n.err)return this.bad(n,e,t,{is_open:l})}if(m.p){t.rs[t.rsI++]=e;let n=t.rsm[m.p];if(!n)return this.bad(this.unknownRule(t.t0,m.p),e,t,{is_open:l});s=e.child=c(n,t,e.node),s.parent=e,s.n={...e.n},0<Object.keys(e.k).length&&(s.k={...e.k}),o+="P`"+m.p+"`"}else if(m.r){let n=t.rsm[m.r];if(!n)return this.bad(this.unknownRule(t.t0,m.r),e,t,{is_open:l});s=c(n,t,e.node),s.parent=e.parent,s.prev=e,s.n={...e.n},0<Object.keys(e.k).length&&(s.k={...e.k}),o+="R`"+m.r+"`"}else l||(s=t.rs[--t.rsI]||t.NORULE);let g=l?e.ao?u.ao:null:e.ac?u.ac:null;if(g){let n;for(let r=0;r<g.length;r++)if(n=g[r](e,t,s,n),(null==n?void 0:n.isToken)&&(null==n?void 0:n.err))return this.bad(n,e,t,{is_open:l})}s.why=o,t.log&&t.log(a.S.node,t,e,n,s),r.OPEN===e.state&&(e.state=r.CLOSE);let v=e[l?"os":"cs"]-(m.b||0);return 1===v?(t.v2=t.v1,t.v1=t.t0,t.t0=t.t1,t.t1=t.NOTOKEN):2==v&&(t.v2=t.t1,t.v1=t.t0,t.t0=t.NOTOKEN,t.t1=t.NOTOKEN),s}bad(e,t,n,r){throw new a.JsonicError(e.err||a.S.unexpected,{...e.use,state:r.is_open?a.S.open:a.S.close},e,t,n)}unknownRule(e,t){return e.err="unknown_rule",e.use=e.use||{},e.use.rulename=t,e}}const g=(...e)=>new m(...e);function v(e){if(r.STRING===typeof e.g?e.g=e.g.split(/\s*,\s*/):null==e.g&&(e.g=[]),e.g=e.g.sort(),e.s&&0!==e.s.length){const t=e=>e.flat().filter(e=>"number"==typeof e),n=(e,t)=>e.filter(e=>31*t<=e&&e<31*(t+1)),r=(e,t)=>e.reduce((e,n)=>1<<n-(31*t+1)|e,0),i=t([e.s[0]]),l=t([e.s[1]]),s=e;s.S0=0<i.length?new Array(Math.max(...i.map(e=>1+e/31|0))).fill(null).map((e,t)=>t).map(e=>r(n(i,e),e)):null,s.S1=0<l.length?new Array(Math.max(...l.map(e=>1+e/31|0))).fill(null).map((e,t)=>t).map(e=>r(n(l,e),e)):null}else e.s=null;return e.p||(e.p=null),e.r||(e.r=null),e.b||(e.b=null),e}o.makeRuleSpec=g;var x={};Object.defineProperty(x,"__esModule",{value:!0}),x.makeParser=x.makeRuleSpec=x.makeRule=void 0;const k=t({}),b=n({});Object.defineProperty(x,"makeRule",{enumerable:!0,get:function(){return o.makeRule}}),Object.defineProperty(x,"makeRuleSpec",{enumerable:!0,get:function(){return o.makeRuleSpec}});class y{constructor(e,t){this.rsm={},this.options=e,this.cfg=t}rule(e,t){if(null==e)return this.rsm;let n=this.rsm[e];if(null===t)delete this.rsm[e];else if(void 0!==t)return n=this.rsm[e]=this.rsm[e]||(0,o.makeRuleSpec)(this.cfg,{}),n=this.rsm[e]=t(this.rsm[e],this)||this.rsm[e],void(n.name=e);return n}start(e,t,n,i){let l,s=(0,b.makeToken)("#ZZ",(0,k.tokenize)("#ZZ",this.cfg),void 0,r.EMPTY,(0,b.makePoint)(-1)),a=(0,b.makeNoToken)(),u={uI:0,opts:this.options,cfg:this.cfg,meta:n||{},src:()=>e,root:()=>l,plgn:()=>t.internal().plugins,inst:()=>t,rule:{},sub:t.internal().sub,xs:-1,v2:s,v1:s,t0:a,t1:a,tC:-2,kI:-1,rs:[],rsI:0,rsm:this.rsm,log:void 0,F:(0,k.srcfmt)(this.cfg),use:{},NOTOKEN:a,NORULE:{}};u=(0,k.deep)(u,i);let c=(0,o.makeNoRule)(u);if(u.NORULE=c,u.rule=c,n&&k.S.function===typeof n.log&&(u.log=n.log),this.cfg.parse.prepare.forEach(e=>e(t,u,n)),""===e){if(this.cfg.lex.empty)return this.cfg.lex.emptyResult;throw new k.JsonicError(k.S.unexpected,{src:e},u.t0,c,u)}let p=(0,k.badlex)((0,b.makeLex)(u),(0,k.tokenize)("#BD",this.cfg),u),d=this.rsm[this.cfg.rule.start];if(null==d)return;let h=(0,o.makeRule)(d,u);l=h;let f=2*(0,k.keys)(this.rsm).length*p.src.length*2*u.cfg.rule.maxmul,m=0;for(;c!==h&&m<f;)u.kI=m,u.rule=h,u.log&&u.log("",u.kI+":"),u.sub.rule&&u.sub.rule.map(e=>e(h,u)),h=h.process(u,p),u.log&&u.log(k.S.stack,u,h,p),m++;if(s.tin!==p.next(h).tin)throw new k.JsonicError(k.S.unexpected,{},u.t0,c,u);const g=u.root().node;if(this.cfg.result.fail.includes(g))throw new k.JsonicError(k.S.unexpected,{},u.t0,c,u);return g}clone(e,t){let n=new y(e,t);return n.rsm=Object.keys(this.rsm).reduce((e,t)=>(e[t]=(0,k.filterRules)(this.rsm[t],this.cfg),e),{}),n.norm(),n}norm(){(0,k.values)(this.rsm).map(e=>e.norm())}}x.makeParser=(...e)=>new y(...e);var j={};function S(e){const{deep:t}=e.util,{OB:n,CB:r,OS:i,CS:l,CL:s,CA:o,TX:a,ST:u,ZZ:c}=e.token,{VAL:p,KEY:d}=e.tokenSet,h=(e,t)=>{if(!t.cfg.rule.finish)return t.t0.src="END_OF_SOURCE",t.t0},f=e=>{const t=e.o0,n=u===t.tin||a===t.tin?t.val:t.src;e.u.key=n};e.rule("val",e=>{e.bo(e=>e.node=void 0).open([{s:[n],p:"map",b:1,g:"map,json"},{s:[i],p:"list",b:1,g:"list,json"},{s:[p],g:"val,json"}]).close([{s:[c],g:"end,json"},{b:1,g:"more,json"}]).bc((e,t)=>{e.node=void 0===e.node?void 0===e.child.node?0===e.os?void 0:e.o0.resolveVal(e,t):e.child.node:e.node})}),e.rule("map",e=>{e.bo(e=>{e.node=Object.create(null)}).open([{s:[n,r],b:1,n:{pk:0},g:"map,json"},{s:[n],p:"pair",n:{pk:0},g:"map,json,pair"}]).close([{s:[r],g:"end,json"}])}),e.rule("list",e=>{e.bo(e=>{e.node=[]}).open([{s:[i,l],b:1,g:"list,json"},{s:[i],p:"elem",g:"list,elem,json"}]).close([{s:[l],g:"end,json"}])}),e.rule("pair",e=>{e.open([{s:[d,s],p:"val",u:{pair:!0},a:f,g:"map,pair,key,json"}]).bc((e,t)=>{e.u.pair&&(e.u.prev=e.node[e.u.key],e.node[e.u.key]=e.child.node)}).close([{s:[o],r:"pair",g:"map,pair,json"},{s:[r],b:1,g:"map,pair,json"}])}),e.rule("elem",e=>{e.open([{p:"val",g:"list,elem,val,json"}]).bc(e=>{!0!==e.u.done&&e.node.push(e.child.node)}).close([{s:[o],r:"elem",g:"list,elem,json"},{s:[l],b:1,g:"list,elem,json"}])});const m=(e,n)=>{let r=e.u.key,i=e.child.node;const l=e.u.prev;i=void 0===i?null:i,e.u.list&&n.cfg.safe.key&&("__proto__"===r||"constructor"===r)||(e.node[r]=null==l?i:n.cfg.map.merge?n.cfg.map.merge(l,i,e,n):n.cfg.map.extend?t(l,i):i)};e.rule("val",e=>{e.open([{s:[d,s],p:"map",b:2,n:{pk:1},g:"pair,jsonic"},{s:[p],g:"val,json"},{s:[[r,l]],b:1,c:e=>0<e.d,g:"val,imp,null,jsonic"},{s:[o],c:e=>0===e.d,p:"list",b:1,g:"list,imp,jsonic"},{s:[o],b:1,g:"list,val,imp,null,jsonic"},{s:[c],g:"jsonic"}],{append:!0,delete:[2]}).close([{s:[[r,l]],b:1,g:"val,json,close",e:(e,t)=>0===e.d?t.t0:void 0},{s:[o],c:e=>e.lte("dlist")&&e.lte("dmap"),r:"list",u:{implist:!0},g:"list,val,imp,comma,jsonic"},{c:e=>e.lte("dlist")&&e.lte("dmap"),r:"list",u:{implist:!0},g:"list,val,imp,space,jsonic",b:1},{s:[c],g:"jsonic"}],{append:!0,move:[1,-1]})}),e.rule("map",e=>{e.bo(e=>{e.n.dmap=1+(e.n.dmap?e.n.dmap:0)}).open([{s:[n,c],b:1,e:h,g:"end,jsonic"}]).open([{s:[d,s],p:"pair",b:2,g:"pair,list,val,imp,jsonic"}],{append:!0}).close([{s:[r],c:e=>e.lte("pk"),g:"end,json"},{s:[r],b:1,g:"path,jsonic"},{s:[[o,l,...p]],b:1,g:"end,path,jsonic"},{s:[c],e:h,g:"end,jsonic"}],{append:!0,delete:[0]})}),e.rule("list",e=>{e.bo(e=>{e.n.dlist=1+(e.n.dlist?e.n.dlist:0),e.prev.u.implist&&(e.node.push(e.prev.node),e.prev.node=e.node)}).open({c:e=>e.prev.u.implist,p:"elem"}).open([{s:[o],p:"elem",b:1,g:"list,elem,val,imp,jsonic"},{p:"elem",g:"list,elem.jsonic"}],{append:!0}).close([{s:[c],e:h,g:"end,jsonic"}],{append:!0})}),e.rule("pair",(e,t)=>{e.open([{s:[o],g:"map,pair,comma,jsonic"}],{append:!0}).bc((e,t)=>{e.u.pair&&m(e,t)}).close([{s:[r],c:e=>e.lte("pk"),b:1,g:"map,pair,json"},{s:[o,r],c:e=>e.lte("pk"),b:1,g:"map,pair,comma,jsonic"},{s:[o,c],g:"end,jsonic"},{s:[o],c:e=>e.lte("pk"),r:"pair",g:"map,pair,json"},{s:[o],c:e=>e.lte("dmap",1),r:"pair",g:"map,pair,jsonic"},{s:[d],c:e=>e.lte("dmap",1),r:"pair",b:1,g:"map,pair,imp,jsonic"},{s:[[r,o,l,...d]],c:e=>0<e.n.pk,b:1,g:"map,pair,imp,path,jsonic"},{s:[l],e:e=>e.c0,g:"end,jsonic"},{s:[c],e:h,g:"map,pair,json"},{r:"pair",b:1,g:"map,pair,imp,jsonic"}],{append:!0,delete:[0,1]})}),e.rule("elem",(e,t)=>{e.open([{s:[o,o],b:2,u:{done:!0},a:e=>e.node.push(null),g:"list,elem,imp,null,jsonic"},{s:[o],u:{done:!0},a:e=>e.node.push(null),g:"list,elem,imp,null,jsonic"},{s:[d,s],e:t.cfg.list.property?void 0:(e,t)=>t.t0,p:"val",n:{pk:1,dmap:1},u:{done:!0,pair:!0,list:!0},a:f,g:"elem,pair,jsonic"}]).bc((e,t)=>{!0===e.u.pair&&(e.u.prev=e.node[e.u.key],m(e,t))}).close([{s:[o,[l,c]],b:1,g:"list,elem,comma,jsonic"},{s:[o],r:"elem",g:"list,elem,json"},{s:[l],b:1,g:"list,elem,json"},{s:[c],e:h,g:"list,elem,json"},{s:[r],e:e=>e.c0,g:"end,jsonic"},{r:"elem",b:1,g:"list,elem,imp,jsonic"}],{delete:[-1,-2]})})}Object.defineProperty(j,"__esModule",{value:!0}),j.makeJSON=j.grammar=void 0,j.grammar=S,j.makeJSON=function(e){let t=e.make({grammar$:!1,text:{lex:!1},number:{hex:!1,oct:!1,bin:!1,sep:null,exclude:/^00+/},string:{chars:'"',multiChars:"",allowUnknown:!1,escape:{v:null}},comment:{lex:!1},map:{extend:!1},lex:{empty:!1},rule:{finish:!1,include:"json"},result:{fail:[void 0,NaN]},tokenSet:{KEY:["#ST",null,null,null]}});return S(t),t};var E={exports:{}};Object.defineProperty(E.exports,"__esModule",{value:!0}),E.exports.root=E.exports.S=E.exports.EMPTY=E.exports.AFTER=E.exports.BEFORE=E.exports.CLOSE=E.exports.OPEN=E.exports.makeTextMatcher=E.exports.makeNumberMatcher=E.exports.makeCommentMatcher=E.exports.makeStringMatcher=E.exports.makeLineMatcher=E.exports.makeSpaceMatcher=E.exports.makeFixedMatcher=E.exports.makeParser=E.exports.makeLex=E.exports.makeRuleSpec=E.exports.makeRule=E.exports.makePoint=E.exports.makeToken=E.exports.make=E.exports.util=E.exports.JsonicError=E.exports.Jsonic=void 0,Object.defineProperty(E.exports,"OPEN",{enumerable:!0,get:function(){return r.OPEN}}),Object.defineProperty(E.exports,"CLOSE",{enumerable:!0,get:function(){return r.CLOSE}}),Object.defineProperty(E.exports,"BEFORE",{enumerable:!0,get:function(){return r.BEFORE}}),Object.defineProperty(E.exports,"AFTER",{enumerable:!0,get:function(){return r.AFTER}}),Object.defineProperty(E.exports,"EMPTY",{enumerable:!0,get:function(){return r.EMPTY}});const O=t({});Object.defineProperty(E.exports,"JsonicError",{enumerable:!0,get:function(){return O.JsonicError}}),Object.defineProperty(E.exports,"S",{enumerable:!0,get:function(){return O.S}});const N=n({});Object.defineProperty(E.exports,"makePoint",{enumerable:!0,get:function(){return N.makePoint}}),Object.defineProperty(E.exports,"makeToken",{enumerable:!0,get:function(){return N.makeToken}}),Object.defineProperty(E.exports,"makeLex",{enumerable:!0,get:function(){return N.makeLex}}),Object.defineProperty(E.exports,"makeFixedMatcher",{enumerable:!0,get:function(){return N.makeFixedMatcher}}),Object.defineProperty(E.exports,"makeSpaceMatcher",{enumerable:!0,get:function(){return N.makeSpaceMatcher}}),Object.defineProperty(E.exports,"makeLineMatcher",{enumerable:!0,get:function(){return N.makeLineMatcher}}),Object.defineProperty(E.exports,"makeStringMatcher",{enumerable:!0,get:function(){return N.makeStringMatcher}}),Object.defineProperty(E.exports,"makeCommentMatcher",{enumerable:!0,get:function(){return N.makeCommentMatcher}}),Object.defineProperty(E.exports,"makeNumberMatcher",{enumerable:!0,get:function(){return N.makeNumberMatcher}}),Object.defineProperty(E.exports,"makeTextMatcher",{enumerable:!0,get:function(){return N.makeTextMatcher}}),Object.defineProperty(E.exports,"makeRule",{enumerable:!0,get:function(){return x.makeRule}}),Object.defineProperty(E.exports,"makeRuleSpec",{enumerable:!0,get:function(){return x.makeRuleSpec}}),Object.defineProperty(E.exports,"makeParser",{enumerable:!0,get:function(){return x.makeParser}});const _={tokenize:O.tokenize,srcfmt:O.srcfmt,clone:O.clone,charset:O.charset,trimstk:O.trimstk,makelog:O.makelog,badlex:O.badlex,extract:O.extract,errinject:O.errinject,errdesc:O.errdesc,configure:O.configure,parserwrap:O.parserwrap,mesc:O.mesc,escre:O.escre,regexp:O.regexp,prop:O.prop,str:O.str,clean:O.clean,deep:O.deep,omap:O.omap,keys:O.keys,values:O.values,entries:O.entries};function T(e,t){let n=!0;if("jsonic"===e)n=!1;else if("json"===e)return(0,j.makeJSON)(w);e="string"==typeof e?{}:e;let r={parser:null,config:null,plugins:[],sub:{lex:void 0,rule:void 0},mark:Math.random()},l=(0,O.deep)({},t?{...t.options}:!1===(null==e?void 0:e.defaults$)?{}:i.defaults,e||{}),s=function(e,t,n){var r;if(O.S.string===typeof e){let i=s.internal();return((null===(r=o.parser)||void 0===r?void 0:r.start)?(0,O.parserwrap)(o.parser):i.parser).start(e,s,t,n)}return e},o=e=>{if(null!=e&&O.S.object===typeof e){(0,O.deep)(l,e),(0,O.configure)(s,r.config,l);let t=s.internal().parser;r.parser=t.clone(l,r.config)}return{...s.options}},a={token:e=>(0,O.tokenize)(e,r.config,s),tokenSet:e=>(0,O.findTokenSet)(e,r.config),fixed:e=>r.config.fixed.ref[e],options:(0,O.deep)(o,l),config:()=>(0,O.deep)(r.config),parse:s,use:function(e,t){if(O.S.function!==typeof e)throw new Error("Jsonic.use: the first argument must be a function defining a plugin. See https://jsonic.senecajs.org/plugin");const n=e.name.toLowerCase(),r=(0,O.deep)({},e.defaults||{},t||{});s.options({plugin:{[n]:r}});let i=s.options.plugin[n];return s.internal().plugins.push(e),e.options=i,e(s,i)||s},rule:(e,t)=>s.internal().parser.rule(e,t)||s,make:e=>T(e,s),empty:e=>T({defaults$:!1,standard$:!1,grammar$:!1,...e||{}}),id:"Jsonic/"+Date.now()+"/"+(""+Math.random()).substring(2,8).padEnd(6,"0")+(null==o.tag?"":"/"+o.tag),toString:()=>a.id,sub:e=>(e.lex&&(r.sub.lex=r.sub.lex||[],r.sub.lex.push(e.lex)),e.rule&&(r.sub.rule=r.sub.rule||[],r.sub.rule.push(e.rule)),s),util:_};if((0,O.defprop)(a.make,O.S.name,{value:O.S.make}),n?(0,O.assign)(s,a):(0,O.assign)(s,{empty:a.empty,parse:a.parse,sub:a.sub,id:a.id,toString:a.toString}),(0,O.defprop)(s,"internal",{value:()=>r}),t){for(let n in t)void 0===s[n]&&(s[n]=t[n]);s.parent=t;let e=t.internal();r.config=(0,O.deep)({},e.config),(0,O.configure)(s,r.config,l),(0,O.assign)(s.token,r.config.t),r.plugins=[...e.plugins],r.parser=e.parser.clone(l,r.config)}else{let e={...s,...a};r.config=(0,O.configure)(e,void 0,l),r.plugins=[],r.parser=(0,x.makeParser)(l,r.config),!1!==l.grammar$&&(0,j.grammar)(e)}return s}let w;E.exports.util=_,E.exports.make=T,E.exports.root=w;let P=E.exports.root=w=T("jsonic");return E.exports.Jsonic=P,w.Jsonic=w,w.JsonicError=O.JsonicError,w.makeLex=N.makeLex,w.makeParser=x.makeParser,w.makeToken=N.makeToken,w.makePoint=N.makePoint,w.makeRule=x.makeRule,w.makeRuleSpec=x.makeRuleSpec,w.makeFixedMatcher=N.makeFixedMatcher,w.makeSpaceMatcher=N.makeSpaceMatcher,w.makeLineMatcher=N.makeLineMatcher,w.makeStringMatcher=N.makeStringMatcher,w.makeCommentMatcher=N.makeCommentMatcher,w.makeNumberMatcher=N.makeNumberMatcher,w.makeTextMatcher=N.makeTextMatcher,w.OPEN=r.OPEN,w.CLOSE=r.CLOSE,w.BEFORE=r.BEFORE,w.AFTER=r.AFTER,w.EMPTY=r.EMPTY,w.util=_,w.make=T,w.S=O.S,E.exports.default=P,E.exports=P,E.exports}))}).call(this)}).call(this,void 0!==e?e:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{}),t=t.exports;var n={};Object.defineProperty(n,"__esModule",{value:!0}),n.testing=n.evaluate=n.Expr=void 0;const{omap:r,entries:i,values:l}=t.util,s={};let o=function(e,t){let n=e.token.bind(e),o=e.fixed.bind(e),j=t.op||{};const S=k(n,o,j,"prefix"),E=k(n,o,j,"suffix"),O=k(n,o,j,"infix"),N=k(n,o,j,"ternary"),_=function(e,t,n){return i(n).reduce((n,[r,i])=>{if(i.paren){let l=t(i.osrc)||e("#E"+i.osrc),o=e(l),a=t(i.csrc)||e("#E"+i.csrc),u=e(a);n[l]={name:r+"-paren",osrc:i.osrc,csrc:i.csrc,otkn:o,otin:l,ctkn:u,ctin:a,preval:{active:null!=i.preval&&(null==i.preval.active||i.preval.active),required:null!=i.preval&&null!=i.preval.required&&i.preval.required},use:{},paren:!0,src:i.osrc,left:Number.MIN_SAFE_INTEGER,right:Number.MAX_SAFE_INTEGER,infix:!1,prefix:!1,suffix:!1,ternary:!1,tkn:"",tin:-1,terms:1,token:{},OP_MARK:s}}return n},{})}(n,o,j),T=r(_,([e,t])=>[void 0,void 0,t.ctin,t]);let w=Object.values({..._,...T}).reduce((e,t)=>(e[t.otkn]=t.osrc,e[t.ctkn]=t.csrc,e),{}),P=Object.values({...S,...E,...O,...N}).reduce((e,t)=>(e[t.tkn]=t.src,e),{});e.options({fixed:{token:{...P,...w}},lex:{match:{comment:{order:1e5}}}});const I=l(S).map(e=>e.tin),M=l(O).map(e=>e.tin),C=l(E).map(e=>e.tin),R=l(N).filter(e=>0===e.use.ternary.opI).map(e=>e.tin),A=l(N).filter(e=>1===e.use.ternary.opI).map(e=>e.tin),V=l(_).map(e=>e.otin),L=l(T).map(e=>e.ctin),D=0<I.length,$=0<M.length,F=0<C.length,Y=0<R.length&&0<A.length,J=0<V.length&&0<L.length,B=e.token.CA,U=e.token.CS,K=e.token.CB,q=e.token.TX,z=e.token.NR,G=e.token.ST,Z=e.token.VL,W=e.token.ZZ,H=[q,z,G,Z];e.rule("val",t=>{Y&&A.includes(e.token.CL)&&(t.def.open.find(e=>e.g.includes("pair")).c=e=>!e.n.expr_ternary),t.open([D?{s:[I],b:1,n:{expr_prefix:1,expr_suffix:0},p:"expr",g:"expr,expr-prefix"}:null,J?{s:[V],b:1,p:"paren",c:(e,t)=>{let n=!0;return _[e.o0.tin].preval.required&&(n="val"===e.prev.name&&e.prev.u.paren_preval),n&&1===e.prev.i&&(t.root=()=>e),n},g:"expr,expr-paren"}:null]).close([Y?{s:[R],c:e=>!e.n.expr,b:1,r:"ternary",g:"expr,expr-ternary"}:null,$?{s:[M],b:1,n:{expr_prefix:0,expr_suffix:0},r:e=>e.n.expr?"":"expr",g:"expr,expr-infix"}:null,F?{s:[C],b:1,n:{expr_prefix:0,expr_suffix:1},r:e=>e.n.expr?"":"expr",g:"expr,expr-suffix"}:null,J?{s:[L],c:e=>!!e.n.expr_paren,b:1,g:"expr,expr-paren"}:null,J?{s:[V],b:1,r:"val",c:e=>_[e.c0.tin].preval.active,u:{paren_preval:!0},g:"expr,expr-paren,expr-paren-preval"}:null,Y?{s:[A],c:e=>!!e.n.expr_ternary,b:1,g:"expr,expr-ternary"}:null,{s:[B],c:e=>1===e.d&&(1<=e.n.expr||1<=e.n.expr_ternary)||1<=e.n.expr_ternary&&1<=e.n.expr_paren,b:1,g:"expr,list,val,imp,comma,top"},{s:[H],c:e=>1===e.d&&(1<=e.n.expr||1<=e.n.expr_ternary)||1<=e.n.expr_ternary&&1<=e.n.expr_paren,b:1,g:"expr,list,val,imp,space,top"}])}),e.rule("list",e=>{e.bo(!1,e=>{e.prev.u.implist||(e.n.expr=0,e.n.expr_prefix=0,e.n.expr_suffix=0,e.n.expr_paren=0,e.n.expr_ternary=0)}).close([J&&{s:[L],b:e=>U!==e.c0.tin||e.n.expr_paren?1:0}])}),e.rule("map",e=>{e.bo(!1,(...e)=>{e[0].n.expr=0,e[0].n.expr_prefix=0,e[0].n.expr_suffix=0,e[0].n.expr_paren=0,e[0].n.expr_ternary=0}).close([J&&{s:[L],b:e=>K!==e.c0.tin||e.n.expr_paren?1:0}])}),e.rule("elem",e=>{e.close([J?{s:[L],b:1,c:e=>!!e.n.expr_paren,g:"expr,expr-paren,imp,close,list"}:null,J?{s:[V],b:1,r:"elem",g:"expr,expr-paren,imp,open,list"}:null])}),e.rule("pair",e=>{e.close([J?{s:[L],b:1,c:e=>!!e.n.expr_paren||0<e.n.pk,g:"expr,expr-paren,imp,map"}:null])}),e.rule("expr",e=>{e.open([D?{s:[I],c:e=>!!e.n.expr_prefix,n:{expr:1,dlist:1,dmap:1},p:"val",g:"expr,expr-prefix",a:e=>{const t=u(e.o0,S);e.node=x(e.parent.node)?b(e.parent.node,t):a(e,e.parent,t)}}:null,$?{s:[M],p:"val",n:{expr:1,expr_prefix:0,dlist:1,dmap:1},a:e=>{const t=e.prev,n=e.parent,r=u(e.o0,O);x(n.node)&&!v("ternary",n.node)?e.node=b(n.node,r):x(t.node)?(e.node=b(t.node,r),e.parent=t):e.node=a(e,t,r)},g:"expr,expr-infix"}:null,F?{s:[C],n:{expr:1,expr_prefix:0,dlist:1,dmap:1},a:e=>{const t=e.prev,n=u(e.o0,E);e.node=x(t.node)?b(t.node,n):a(e,t,n)},g:"expr,expr-suffix"}:null]).bc(e=>{var t;x(e.node)&&(null===(t=e.node)||void 0===t?void 0:t.length)-1<e.node[0].terms&&e.node.push(e.child.node)}).close([$?{s:[M],c:e=>!e.n.expr_prefix,b:1,r:"expr",g:"expr,expr-infix"}:null,F?{s:[C],c:e=>!e.n.expr_prefix,b:1,r:"expr",g:"expr,expr-suffix"}:null,J?{s:[L],c:e=>!!e.n.expr_paren,b:1}:null,Y?{s:[R],c:e=>!e.n.expr_prefix,b:1,r:"ternary",g:"expr,expr-ternary"}:null,{s:[B],c:e=>e.d<=0,n:{expr:0},r:"elem",a:e=>e.parent.node=e.node=[e.node],g:"expr,comma,list,top"},{s:[H],c:e=>e.d<=0,n:{expr:0},b:1,r:"elem",a:e=>e.parent.node=e.node=[e.node],g:"expr,space,list,top"},{s:[B],c:e=>e.lte("pk"),n:{expr:0},b:1,h:f,g:"expr,list,val,imp,comma"},{c:e=>e.lte("pk")&&e.lte("expr_suffix"),n:{expr:0},h:f,g:"expr,list,val,imp,space"},{n:{expr:0},g:"expr,expr-end"}]).ac(e=>{t.evaluate&&0===e.n.expr&&(e.parent.node=y(e.parent,e.parent.node,t.evaluate))})}),e.rule("paren",e=>{e.bo(e=>{e.n.dmap=0,e.n.dlist=0,e.n.pk=0}).open([J?{s:[V,L],b:1,g:"expr,expr-paren,empty",c:e=>_[e.o0.tin].name===T[e.o1.tin].name,a:d(_)}:null,J?{s:[V],p:"val",n:{expr_paren:1,expr:0,expr_prefix:0,expr_suffix:0},g:"expr,expr-paren,open",a:d(_)}:null]).close([J?{s:[L],c:e=>{let t="expr_paren_depth_"+T[e.c0.tin].name;return!!e.n[t]},a:h(T),g:"expr,expr-paren,close"}:null])}),Y&&e.rule("ternary",e=>{e.open([{s:[R],p:"val",n:{expr_ternary:1,expr:0,expr_prefix:0,expr_suffix:0},u:{expr_ternary_step:1},g:"expr,expr-ternary,open",a:e=>{let t=u(e.o0,N);e.u.expr_ternary_name=t.name,x(e.prev.node)?e.node=c(e.prev.node,t,p(e.prev.node)):e.node=e.prev.node=c([],t,e.prev.node),e.u.expr_ternary_paren=e.n.expr_paren||e.prev.u.expr_ternary_paren||0,e.n.expr_paren=0}},{p:"val",c:e=>2===e.prev.u.expr_ternary_step,a:e=>{e.u.expr_ternary_step=e.prev.u.expr_ternary_step,e.n.expr_paren=e.u.expr_ternary_paren=e.prev.u.expr_ternary_paren},g:"expr,expr-ternary,step"}]).close([{s:[A],c:e=>1===e.u.expr_ternary_step&&e.u.expr_ternary_name===N[e.c0.tin].name,r:"ternary",a:e=>{e.u.expr_ternary_step++,e.node.push(e.child.node)},g:"expr,expr-ternary,step"},{s:[[B,...L]],c:m,b:(e,t)=>L.includes(t.t0.tin)?1:0,r:(e,t)=>{var n;return L.includes(t.t0.tin)||0!==e.d&&(!e.prev.u.expr_ternary_paren||(null===(n=e.parent.node)||void 0===n?void 0:n.length))?"":"elem"},a:g,g:"expr,expr-ternary,list,val,imp,comma"},{c:m,r:(e,t)=>{var n;return 0!==e.d&&L.includes(t.t0.tin)&&!e.prev.u.expr_ternary_paren||(null===(n=e.parent.node)||void 0===n?void 0:n.length)||W===t.t0.tin?"":"elem"},a:g,g:"expr,expr-ternary,list,val,imp,space"},{c:e=>0<e.d&&2===e.u.expr_ternary_step,a:e=>{e.node.push(e.child.node)},g:"expr,expr-ternary,close"}])})};function a(e,t,n){let r=t.node;return x(t.node)?r=p(t.node):t.node=[],c(t.node,n),n.prefix||(t.node[1]=r),e.parent=t,t.node}function u(e,t){return{...t[e.tin],token:e,OP_MARK:s}}function c(e,t,...n){let r=e;r[0]=t;let i=0;for(;i<n.length;i++)r[i+1]=n[i];return r.length=i+1,r}function p(e){return[...e]}function d(e){return function(t){let n="expr_paren_depth_"+u(t.o0,e).name;t.u[n]=t.n[n]=1,t.node=void 0}}function h(e){return function(t){(x(t.child.node)||void 0===t.node)&&(t.node=t.child.node);const n=u(t.c0,e);let r="expr_paren_depth_"+n.name;if(t.u[r]===t.n[r]){const e=t.node;t.node=[n],void 0!==e&&(t.node[1]=e),t.parent.prev.u.paren_preval&&(v("paren",t.parent.prev.node)?t.node=c(t.parent.prev.node,t.node[0],p(t.parent.prev.node),t.node[1]):(t.node.splice(1,0,t.parent.prev.node),t.parent.prev.node=t.node))}}}function f(e,t,n){let r=null;for(let i=t.rsI-1;-1<i;i--)if("paren"===t.rs[i].name){r=t.rs[i];break}return r&&(null==r.child.node?(r.child.node=[e.node],n.r="elem",n.b=0):x(r.child.node)&&(r.child.node=[r.child.node],n.r="elem",n.b=0),e.node=r.child.node),n}function m(e){return(0===e.d||1<=e.n.expr_paren)&&!e.n.pk&&2===e.u.expr_ternary_step}function g(e,t,n){e.n.expr_paren=e.prev.u.expr_ternary_paren,e.node.push(e.child.node),"elem"===n.r&&(e.node[0]=p(e.node),e.node.length=1)}function v(e,t){return null!=t&&x(t)&&!0===t[0][e]}function x(e){return null!=e&&e[0]&&e[0].OP_MARK===s}function k(e,t,n,r){return Object.entries(n).filter(([e,t])=>t[r]).reduce((n,[i,l])=>{let o="",a=-1,u="";u="string"==typeof l.src?l.src:l.src[0],a=t(u)||e("#E"+u),o=e(a);let c=n[a]={src:u,left:l.left||Number.MIN_SAFE_INTEGER,right:l.right||Number.MAX_SAFE_INTEGER,name:i+(i.endsWith("-"+r)?"":"-"+r),infix:"infix"===r,prefix:"prefix"===r,suffix:"suffix"===r,ternary:"ternary"===r,tkn:o,tin:a,terms:"ternary"===r?3:"infix"===r?2:1,use:{},paren:!1,osrc:"",csrc:"",otkn:"",ctkn:"",otin:-1,ctin:-1,preval:{active:!1,required:!1},token:{},OP_MARK:s};if(c.ternary){let r=l.src;c.src=r[0],c.use.ternary={opI:0};let i={...c};u=l.src[1],a=t(u)||e("#E"+u),o=e(a),i.src=u,i.use={ternary:{opI:1}},i.tkn=o,i.tin=a,n[a]=i}return n},{})}function b(e,t){let n=e,r=e[0];if(t)if(t.infix)if(r.suffix||t.left<=r.right)c(e,t,p(e));else{const i=r.terms;n=x(e[i])&&e[i][0].right<t.left?b(e[i],t):e[i]=c([],t,e[i])}else if(t.prefix)n=e[r.terms]=c([],t);else if(t.suffix)if(!r.suffix&&r.right<=t.left){const n=r.terms;x(e[n])&&e[n][0].prefix&&e[n][0].right<t.left?b(e[n],t):e[n]=c([],t,e[n])}else c(e,t,p(e));return n}function y(e,t,n){return null==t?t:x(t)?n(e,t[0],t.slice(1).map(t=>y(e,t,n))):t}n.Expr=o,o.defaults={op:{positive:{prefix:!0,right:14e3,src:"+"},negative:{prefix:!0,right:14e3,src:"-"},addition:{infix:!0,left:140,right:150,src:"+"},subtraction:{infix:!0,left:140,right:150,src:"-"},multiplication:{infix:!0,left:160,right:170,src:"*"},division:{infix:!0,left:160,right:170,src:"/"},remainder:{infix:!0,left:160,right:170,src:"%"},plain:{paren:!0,osrc:"(",csrc:")"}}},n.evaluate=y;const j={prattify:b,opify:e=>(e.OP_MARK=s,e)};return n.testing=j,n}))}).call(this)}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{}),xe=xe.exports;var ke={exports:{}};(function(e){(function(){!function(t){"object"==typeof ke.exports?ke.exports=t():("undefined"!=typeof window?window:void 0!==e?e:"undefined"!=typeof self?self:this).JsonicPath=t()}((function(){var e={};Object.defineProperty(e,"__esModule",{value:!0}),e.Path=void 0;const t=(e,t)=>{e.rule("val",e=>{e.bo(e=>{0===e.d&&(e.k.path=[])})}),e.rule("map",e=>{e.bo(e=>{delete e.k.index})}),e.rule("pair",e=>{e.ao(e=>{0<e.d&&e.u.pair&&(e.child.k.path=[...e.k.path,e.u.key],e.child.k.key=e.u.key)})}),e.rule("list",e=>{e.bo(e=>{e.k.index=-1})}),e.rule("elem",e=>{e.ao(e=>{0<e.d&&(e.k.index=1+e.k.index,e.child.k.path=[...e.k.path,e.k.index],e.child.k.key=e.k.index,e.child.k.index=e.k.index)})})};return e.Path=t,t.defaults={},e}))}).call(this)}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{}),ke=ke.exports;var be={};Object.defineProperty(be,"__esModule",{value:!0}),be.DONE=void 0,be.DONE=-1;var ye={};Object.defineProperty(ye,"__esModule",{value:!0}),ye.descErr=void 0,ye.descErr=function e(t){var n,r,i;if(null==t?void 0:t.isNil){if(null==t.msg||""===t.msg){let e=t.primary,l=t.secondary;t.msg="Cannot "+(null==l?"resolve":"unify")+(0<(null===(n=t.path)||void 0===n?void 0:n.length)?" path "+t.path.join("."):"")+" "+(t.url?"in "+t.url:"")+":\n"+(null==e?"":"LHS: "+(0<(null===(r=e.path)||void 0===r?void 0:r.length)?e.path.join(".")+":":"")+`<${e.canon}>:${e.row}:${e.col} `+(e.url&&e.url!==t.url?" in "+e.url:"")+"\n")+(null==l?"":"RHS: "+(0<(null===(i=l.path)||void 0===i?void 0:i.length)?l.path.join(".")+":":"")+`<${l.canon}>:${l.row}:${l.col} `+(l.url&&l.url!==t.url?" in "+l.url:"")+"\n")}return t}return t.map(t=>e(t))};var je={};Object.defineProperty(je,"__esModule",{value:!0}),je.util=je.Context=je.Lang=je.Nil=je.Aontu=void 0;const Se=t({});Object.defineProperty(je,"Lang",{enumerable:!0,get:function(){return Se.Lang}});const Ee=d({});Object.defineProperty(je,"Context",{enumerable:!0,get:function(){return Ee.Context}});const Oe=h({});function Ne(e,t){let n=_e.options(e,t),r={},i=_e.parse(n,{deps:r}),l=new Ee.Unify(i),s=l.res,o=l.err;return(0,ye.descErr)(l.err),s.deps=r,s.err=o,s}Object.defineProperty(je,"Nil",{enumerable:!0,get:function(){return Oe.Nil}}),je.Aontu=Ne;const _e={options:(e,t)=>({src:"",print:0,..."string"==typeof e?{src:e}:e,...t||{}}),parse:(e,t)=>new Se.Lang(e).parse(e.src,{deps:t.deps})};return je.util=_e,je.default=Ne,je}));
}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],2:[function(require,module,exports){
"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.descErr = void 0;
// TODO: move to utility?
function descErr(err) {
    var _a, _b, _c;
    if (err === null || err === void 0 ? void 0 : err.isNil) {
        if (null == err.msg || '' === err.msg) {
            let v1 = err.primary;
            let v2 = err.secondary;
            err.msg =
                'Cannot ' +
                    (null == v2 ? 'resolve' : 'unify') +
                    (0 < ((_a = err.path) === null || _a === void 0 ? void 0 : _a.length) ? ' path ' + err.path.join('.') : '') +
                    ' ' + (err.url ? 'in ' + err.url : '') + ':\n' +
                    (null == v1 ? '' :
                        'LHS: ' +
                            (0 < ((_b = v1.path) === null || _b === void 0 ? void 0 : _b.length) ? v1.path.join('.') + ':' : '') +
                            `<${v1.canon}>:${v1.row}:${v1.col}` + ' ' +
                            ((v1.url && v1.url !== err.url) ? ' in ' + v1.url : '') + '\n') +
                    (null == v2 ? '' :
                        'RHS: ' +
                            (0 < ((_c = v2.path) === null || _c === void 0 ? void 0 : _c.length) ? v2.path.join('.') + ':' : '') +
                            `<${v2.canon}>:${v2.row}:${v2.col}` + ' ' +
                            ((v2.url && v2.url !== err.url) ? ' in ' + v2.url : '') + '\n') +
                    '';
        }
        return err;
    }
    else {
        return err.map((n) => descErr(n));
    }
}
exports.descErr = descErr;

},{}],3:[function(require,module,exports){
"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Site = exports.Lang = void 0;
const jsonic_next_1 = require("@jsonic/jsonic-next");
const debug_1 = require('@jsonic/jsonic-next/dist/debug.js');
const multisource_1 = require("@jsonic/multisource");
const file_1 = require('@jsonic/multisource/dist/resolver/file.js');
const pkg_1 = require('@jsonic/multisource/dist/resolver/pkg.js');
const mem_1 = require('@jsonic/multisource/dist/resolver/mem.js');
const expr_1 = require("@jsonic/expr");
const path_1 = require("@jsonic/path");
const DisjunctVal_1 = require("./val/DisjunctVal");
const ConjunctVal_1 = require("./val/ConjunctVal");
const ListVal_1 = require("./val/ListVal");
const MapVal_1 = require("./val/MapVal");
const Nil_1 = require("./val/Nil");
const PrefVal_1 = require("./val/PrefVal");
const RefVal_1 = require("./val/RefVal");
const VarVal_1 = require("./val/VarVal");
const val_1 = require("./val");
class Site {
    // static NONE = new Site(TOP)
    constructor(val) {
        this.row = -1;
        this.col = -1;
        this.url = '';
        // TODO: logic to select most meaningful site if val has no site,
        // but has peg children that do.
        this.row = val.row;
        this.col = val.col;
        this.url = val.url;
    }
}
exports.Site = Site;
let AontuJsonic = function aontu(jsonic) {
    jsonic.use(path_1.Path);
    // TODO: refactor Val constructor
    let addpath = (v, p) => (v.path = [...(p || [])], v);
    jsonic.options({
        value: {
            def: {
                // NOTE: specify with functions as jsonic/deep will
                // remove class prototype as options are assumed plain
                // (except for functions).
                // TODO: jsonic should be able to pass context into these
                'string': {
                    val: (r) => addpath(new val_1.ScalarTypeVal({ peg: String }), r.k.path)
                },
                'number': {
                    val: (r) => addpath(new val_1.ScalarTypeVal({ peg: Number }), r.k.path)
                },
                'integer': {
                    val: (r) => addpath(new val_1.ScalarTypeVal({ peg: val_1.Integer }), r.k.path)
                },
                'boolean': {
                    val: (r) => addpath(new val_1.ScalarTypeVal({ peg: Boolean }), r.k.path)
                },
                'nil': {
                    val: (r) => addpath(new Nil_1.Nil('literal'), r.k.path)
                },
                // TODO: FIX: need a TOP instance to hold path
                'top': { val: () => val_1.TOP },
            }
        },
        map: {
            merge: (prev, curr) => {
                let pval = prev;
                let cval = curr;
                if ((pval === null || pval === void 0 ? void 0 : pval.isVal) && (cval === null || cval === void 0 ? void 0 : cval.isVal)) {
                    // TODO: test multi element conjuncts work
                    if (pval instanceof ConjunctVal_1.ConjunctVal && cval instanceof ConjunctVal_1.ConjunctVal) {
                        pval.append(cval);
                        return pval;
                    }
                    else if (pval instanceof ConjunctVal_1.ConjunctVal) {
                        pval.append(cval);
                        return pval;
                    }
                    // else if (cval instanceof ConjunctVal) {
                    //   cval.append(pval)
                    //   return cval
                    // }
                    else {
                        return addpath(new ConjunctVal_1.ConjunctVal({ peg: [pval, cval] }), prev.path);
                    }
                }
                // Handle defered conjuncts, where MapVal does not yet
                // exist, by creating ConjunctVal later.
                else {
                    prev.___merge = (prev.___merge || []);
                    prev.___merge.push(curr);
                    return prev;
                }
            }
        }
    });
    let opmap = {
        'conjunct-infix': (r, _op, terms) => addpath(new ConjunctVal_1.ConjunctVal({ peg: terms }), r.k.path),
        'disjunct-infix': (r, _op, terms) => addpath(new DisjunctVal_1.DisjunctVal({ peg: terms }), r.k.path),
        'dot-prefix': (r, _op, terms) => {
            return addpath(new RefVal_1.RefVal({ peg: terms, prefix: true }), r.k.path);
        },
        'dot-infix': (r, _op, terms) => {
            return addpath(new RefVal_1.RefVal({ peg: terms }), r.k.path);
        },
        'star-prefix': (r, _op, terms) => addpath(new PrefVal_1.PrefVal({ peg: terms[0] }), r.k.path),
        'dollar-prefix': (r, _op, terms) => {
            // $.a.b absolute path
            if (terms[0] instanceof RefVal_1.RefVal) {
                terms[0].absolute = true;
                return terms[0];
            }
            return addpath(new VarVal_1.VarVal({ peg: terms[0] }), r.k.path);
        },
    };
    jsonic
        .use(expr_1.Expr, {
        op: {
            // PPP
            // disjunct > conjunct: c & b | a -> c & (b | a)
            'conjunct': {
                infix: true, src: '&', left: 14000000, right: 15000000
            },
            'disjunct': {
                infix: true, src: '|', left: 16000000, right: 17000000
            },
            'dollar-prefix': {
                src: '$',
                prefix: true,
                right: 31000000,
            },
            'dot-infix': {
                src: '.',
                infix: true,
                left: 25000000,
                right: 24000000,
            },
            'dot-prefix': {
                src: '.',
                prefix: true,
                right: 24000000,
            },
            'star': {
                src: '*',
                prefix: true,
                right: 24000000,
            },
        },
        evaluate: (r, op, terms) => {
            let val = opmap[op.name](r, op, terms);
            return val;
        }
    });
    // PPP
    let CJ = jsonic.token['#E&'];
    let CL = jsonic.token.CL;
    jsonic.rule('val', (rs) => {
        rs
            // PPP
            .open([{ s: [CJ, CL], p: 'map', b: 2, n: { pk: 1 }, g: 'spread' }])
            .bc((r, ctx) => {
            let valnode = r.node;
            let valtype = typeof valnode;
            if ('string' === valtype) {
                valnode = addpath(new val_1.StringVal({ peg: r.node }), r.k.path);
            }
            else if ('number' === valtype) {
                if (Number.isInteger(r.node)) {
                    valnode = addpath(new val_1.IntegerVal({ peg: r.node }), r.k.path);
                }
                else {
                    valnode = addpath(new val_1.NumberVal({ peg: r.node }), r.k.path);
                }
            }
            else if ('boolean' === valtype) {
                valnode = addpath(new val_1.BooleanVal({ peg: r.node }), r.k.path);
            }
            let st = r.o0;
            valnode.row = st.rI;
            valnode.col = st.cI;
            // JSONIC-UPDATE: still valid? check multisource
            valnode.url = ctx.meta.multisource && ctx.meta.multisource.path;
            r.node = valnode;
            // return out
            return undefined;
        });
        return rs;
    });
    jsonic.rule('map', (rs) => {
        rs
            // PPP
            .open([{ s: [CJ, CL], p: 'pair', b: 2, g: 'spread' }])
            .bc((r) => {
            let mo = r.node;
            //  Handle defered conjuncts, e.g. `{x:1 @"foo"}`
            if (mo.___merge) {
                let mop = { ...mo };
                delete mop.___merge;
                // TODO: needs addpath?
                let mopv = new MapVal_1.MapVal({ peg: mop });
                r.node =
                    addpath(new ConjunctVal_1.ConjunctVal({ peg: [mopv, ...mo.___merge] }), r.k.path);
            }
            else {
                r.node = addpath(new MapVal_1.MapVal({ peg: mo }), r.k.path);
            }
            return undefined;
        });
        return rs;
    });
    jsonic.rule('list', (rs) => {
        rs.bc((r) => {
            r.node = addpath(new ListVal_1.ListVal({ peg: r.node }), r.k.path);
            return undefined;
        });
        return rs;
    });
    jsonic.rule('pair', (rs) => {
        rs
            // PPP
            .open([{
                s: [CJ, CL], p: 'val',
                u: { spread: true },
                g: 'spread'
            }])
            // NOTE: manually adjust path - @jsonic/path ignores as not pair:true
            .ao((r) => {
            if (0 < r.d && r.u.spread) {
                r.child.k.path = [...r.k.path, '&'];
                r.child.k.key = '&';
            }
        })
            .bc((rule) => {
            // TRAVERSE PARENTS TO GET PATH
            if (rule.u.spread) {
                rule.node[MapVal_1.MapVal.SPREAD] =
                    (rule.node[MapVal_1.MapVal.SPREAD] || { o: rule.o0.src, v: [] });
                rule.node[MapVal_1.MapVal.SPREAD].v.push(rule.child.node);
            }
            return undefined;
        });
        return rs;
    });
    jsonic.rule('elem', (rs) => {
        rs
            // PPP
            .open([{ s: [CJ, CL], p: 'val', u: { spread: true }, n: { pk: 1 }, g: 'spread' }])
            .bc((rule) => {
            // TRAVERSE PARENTS TO GET PATH
            if (rule.u.spread) {
                rule.node[ListVal_1.ListVal.SPREAD] =
                    (rule.node[ListVal_1.ListVal.SPREAD] || { o: rule.o0.src, v: [] });
                rule.node[ListVal_1.ListVal.SPREAD].v.push(rule.child.node);
            }
            return undefined;
        });
        return rs;
    });
};
// const includeFileResolver = makeFileResolver((spec: any) => {
//   return 'string' === typeof spec ? spec : spec?.peg
// })
function makeModelResolver(options) {
    var _a, _b;
    const useRequire = options.require || require;
    let memResolver = (0, mem_1.makeMemResolver)({
        ...(((_a = options.resolver) === null || _a === void 0 ? void 0 : _a.mem) || {})
    });
    // let fileResolver = makeFileResolver({
    //   ...(options.resolver?.file || {})
    // })
    // TODO: make this consistent with other resolvers
    let fileResolver = (0, file_1.makeFileResolver)((spec) => {
        return 'string' === typeof spec ? spec : spec === null || spec === void 0 ? void 0 : spec.peg;
    });
    let pkgResolver = (0, pkg_1.makePkgResolver)({
        require: useRequire,
        ...(((_b = options.resolver) === null || _b === void 0 ? void 0 : _b.pkg) || {})
    });
    return function ModelResolver(spec, popts, rule, ctx, jsonic) {
        let path = 'string' === typeof spec ? spec : spec === null || spec === void 0 ? void 0 : spec.peg;
        let search = [];
        let res = memResolver(path, popts, rule, ctx, jsonic);
        res.path = path;
        if (res.found) {
            return res;
        }
        search = search.concat(res.search);
        res = fileResolver(path, popts, rule, ctx, jsonic);
        res.path = path;
        if (res.found) {
            return res;
        }
        search = search.concat(res.search);
        res = pkgResolver(path, popts, rule, ctx, jsonic);
        res.path = path;
        if (res.found) {
            return res;
        }
        res.search = search.concat(res.search);
        return res;
    };
}
class Lang {
    constructor(options) {
        this.options = {
            src: '',
            print: -1,
            debug: false,
        };
        this.options = Object.assign({}, this.options, options);
        const modelResolver = makeModelResolver(this.options);
        this.jsonic = jsonic_next_1.Jsonic.make();
        if (this.options.debug) {
            this.jsonic.use(debug_1.Debug, { trace: true });
        }
        this.jsonic
            .use(AontuJsonic)
            .use(multisource_1.MultiSource, {
            // resolver: options?.resolver || includeFileResolver
            resolver: (options === null || options === void 0 ? void 0 : options.resolver) || modelResolver
        });
    }
    parse(src, opts) {
        // JSONIC-UPDATE - check meta
        let jm = {
            fileName: this.options.path,
            multisource: {
                path: this.options.path,
                deps: (opts && opts.deps) || undefined
            }
        };
        // Pass through Jsonic debug log value
        if (opts && null != opts.log && Number.isInteger(opts.log)) {
            jm.log = opts.log;
        }
        // jm.log = -1
        let val;
        try {
            val = this.jsonic(src, jm);
        }
        catch (e) {
            if (e instanceof jsonic_next_1.JsonicError || 'JsonicError' === e.constructor.name) {
                val = new Nil_1.Nil({
                    why: 'parse',
                    err: new Nil_1.Nil({
                        why: 'syntax',
                        msg: e.message,
                        err: e,
                    })
                });
            }
            else {
                throw e;
            }
        }
        return val;
    }
}
exports.Lang = Lang;

},{"./val":9,"./val/ConjunctVal":10,"./val/DisjunctVal":11,"./val/ListVal":12,"./val/MapVal":13,"./val/Nil":14,"./val/PrefVal":15,"./val/RefVal":16,"./val/VarVal":18,"@jsonic/expr":28,"@jsonic/jsonic-next":30,"@jsonic/jsonic-next/dist/debug.js":29,"@jsonic/multisource":31,"@jsonic/multisource/dist/resolver/file.js":34,"@jsonic/multisource/dist/resolver/mem.js":35,"@jsonic/multisource/dist/resolver/pkg.js":36,"@jsonic/path":37}],4:[function(require,module,exports){
"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.disjunct = void 0;
const DisjunctVal_1 = require("../val/DisjunctVal");
const ValBase_1 = require("../val/ValBase");
const disjunct = (ctx, a, b) => {
    let peers = [];
    let origsites = [];
    // origsites.push(append(peers, a))
    // origsites.push(append(peers, b))
    let out = new DisjunctVal_1.DisjunctVal({ peg: peers }, ctx, origsites);
    return out;
};
exports.disjunct = disjunct;
function append(peers, v) {
    // let origsite: Site = Site.NONE
    if (v.isDisjunctVal) {
        peers.push(...v.peg);
        // origsite = v.site
    }
    // TODO: handle no-error Nil (drop) and error Nil (keep and become)
    else if (v instanceof ValBase_1.ValBase) {
        peers.push(v);
    }
    // return origsite
}

},{"../val/DisjunctVal":11,"../val/ValBase":17}],5:[function(require,module,exports){
"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License. */
Object.defineProperty(exports, "__esModule", { value: true });
exports.unite = exports.disjunct = void 0;
const disjunct_1 = require("./disjunct");
Object.defineProperty(exports, "disjunct", { enumerable: true, get: function () { return disjunct_1.disjunct; } });
const unite_1 = require("./unite");
Object.defineProperty(exports, "unite", { enumerable: true, get: function () { return unite_1.unite; } });

},{"./disjunct":4,"./unite":6}],6:[function(require,module,exports){
"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.unite = void 0;
const type_1 = require("../type");
const Nil_1 = require("../val/Nil");
const val_1 = require("../val");
let uc = 0;
// Vals should only have to unify downwards (in .unify) over Vals they understand.
// and for complex Vals, TOP, which means self unify if not yet done
const unite = (ctx, a, b, whence) => {
    let out = a;
    let why = 'u';
    // console.log('AA OP unite  IN', a?.canon, b?.canon,
    //   'W', whence,
    //   'E', 0 < ctx?.err?.length ? ctx.err.map((e: Val) => e.canon) : '')
    let unified = false;
    if (b && (val_1.TOP === a || !a)) {
        //console.log('Utb', b.canon)
        out = b;
        why = 'b';
    }
    else if (a && (val_1.TOP === b || !b)) {
        //console.log('Uta', a.canon)
        out = a;
        why = 'a';
    }
    else if (a && b && val_1.TOP !== b) {
        if (a.isNil) {
            out = update(a, b);
            why = 'an';
        }
        else if (b.isNil) {
            out = update(b, a);
            why = 'bn';
        }
        else if (a.isConjunctVal) {
            // console.log('Q', a.canon, b.canon)
            out = a.unify(b, ctx);
            unified = true;
            why = 'acj';
        }
        else if (b.isConjunctVal ||
            b.isDisjunctVal ||
            b.isRefVal ||
            b.isPrefVal) {
            // console.log('U', a.canon, b.canon)
            // return b.unify(a, ctx)
            out = b.unify(a, ctx);
            unified = true;
            // console.log('UO', out.canon)
            why = 'bv';
        }
        // Exactly equal scalars.
        else if (a.constructor === b.constructor && a.peg === b.peg) {
            out = update(a, b);
            why = 'up';
        }
        else {
            // console.log('QQQ')
            out = a.unify(b, ctx);
            unified = true;
            why = 'ab';
        }
    }
    if (!out || !out.unify) {
        out = Nil_1.Nil.make(ctx, 'unite', a, b);
        why += 'N';
    }
    if (type_1.DONE !== out.done && !unified) {
        out = out.unify(val_1.TOP, ctx);
        why += 'T';
    }
    // console.log('AA OP unite OUT', a?.canon, b?.canon, '->', out && out.canon,
    //   0 < ctx?.err?.length ? ctx.err.map((e: Val) => e.canon) : '')
    uc++;
    // TODO: KEEP THIS! print in debug mode! push to ctx.log?
    /*
    console.log(
      'U',
      ('' + ctx.cc).padStart(2),
      ('' + uc).padStart(4),
      (whence || '').substring(0, 16).padEnd(16),
      why.padEnd(6),
      ctx.path.join('.').padEnd(16),
      (a || '').constructor.name.substring(0, 3),
      '&',
      (b || '').constructor.name.substring(0, 3),
      '|',
      '  '.repeat(ctx.path.length),
      a?.canon, '&', b?.canon, '->', out.canon)
    */
    return out;
};
exports.unite = unite;
function update(x, _y) {
    // TODO: update x with y.site
    return x;
}

},{"../type":7,"../val":9,"../val/Nil":14}],7:[function(require,module,exports){
"use strict";
/* Copyright (c) 2022-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DONE = void 0;
const DONE = -1;
exports.DONE = DONE;

},{}],8:[function(require,module,exports){
"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Unify = exports.Context = void 0;
const type_1 = require("./type");
const val_1 = require("./val");
const lang_1 = require("./lang");
const op_1 = require("./op/op");
class Context {
    constructor(cfg) {
        this.cc = -1;
        this.var = {};
        this.root = cfg.root;
        this.path = cfg.path || [];
        this.err = cfg.err || [];
        // Multiple unify passes will keep incrementing Val counter.
        this.vc = null == cfg.vc ? 1000000000 : cfg.vc;
        this.cc = null == cfg.cc ? this.cc : cfg.cc;
        this.var = cfg.var || this.var;
    }
    clone(cfg) {
        return new Context({
            root: cfg.root || this.root,
            path: cfg.path,
            err: cfg.err || this.err,
            vc: this.vc,
            cc: this.cc,
            var: { ...this.var },
        });
    }
    descend(key) {
        return this.clone({
            root: this.root,
            path: this.path.concat(key),
        });
    }
}
exports.Context = Context;
class Unify {
    constructor(root, lang, ctx) {
        this.lang = lang || new lang_1.Lang();
        if ('string' === typeof root) {
            root = this.lang.parse(root);
        }
        this.cc = 0;
        this.root = root;
        this.res = root;
        this.err = root.err || [];
        let res = root;
        // Only unify if no syntax errors
        if (!root.nil) {
            ctx = ctx || new Context({
                root: res,
                err: this.err,
            });
            // TODO: derive maxdc from res deterministically
            // perhaps parse should count intial vals, paths, etc?
            let maxdc = 9; // 99
            for (; this.cc < maxdc && type_1.DONE !== res.done; this.cc++) {
                ctx.cc = this.cc;
                res = (0, op_1.unite)(ctx, res, val_1.TOP);
                ctx = ctx.clone({ root: res });
            }
        }
        this.res = res;
    }
}
exports.Unify = Unify;

},{"./lang":3,"./op/op":5,"./type":7,"./val":9}],9:[function(require,module,exports){
"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegerVal = exports.BooleanVal = exports.StringVal = exports.NumberVal = exports.ScalarTypeVal = exports.Integer = exports.TOP = void 0;
const type_1 = require("./type");
const unify_1 = require("./unify");
const lang_1 = require("./lang");
const Nil_1 = require("./val/Nil");
const ValBase_1 = require("./val/ValBase");
// There can be only one.
class TopVal extends ValBase_1.ValBase {
    constructor() {
        super(null);
        this.isTop = true;
        this.id = 0;
        this.top = true;
        this.peg = undefined;
        this.done = type_1.DONE;
        this.path = [];
        this.row = -1;
        this.col = -1;
        this.url = '';
        // TOP is always DONE, by definition.
        this.done = type_1.DONE;
    }
    unify(peer, _ctx) {
        return peer;
    }
    get canon() { return 'top'; }
    get site() { return new lang_1.Site(this); }
    same(peer) {
        return this === peer;
    }
    clone() {
        return this;
    }
    gen(_ctx) {
        return undefined;
    }
}
const TOP = new TopVal();
exports.TOP = TOP;
// A ScalarType for integers. Number includes floats.
class Integer {
}
exports.Integer = Integer;
class ScalarTypeVal extends ValBase_1.ValBase {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isScalarTypeVal = true;
        this.done = type_1.DONE;
    }
    unify(peer, ctx) {
        if (peer === null || peer === void 0 ? void 0 : peer.isScalarVal) {
            if (peer.type === this.peg) {
                return peer;
            }
            else if (Number === this.peg && Integer === peer.type) {
                return peer;
            }
            return Nil_1.Nil.make(ctx, 'no-scalar-unify', this, peer);
        }
        else {
            if (peer === null || peer === void 0 ? void 0 : peer.isScalarTypeVal) {
                if (Number === this.peg && Integer === peer.peg) {
                    return peer;
                }
                else if (Number === peer.peg && Integer === this.peg) {
                    return this;
                }
            }
            return Nil_1.Nil.make(ctx, 'scalar-type', this, peer);
        }
    }
    get canon() {
        let ctor = this.peg;
        return ctor.name.toLowerCase();
    }
    same(peer) {
        let out = (peer === null || peer === void 0 ? void 0 : peer.isScalarTypeVal) ? this.peg === (peer === null || peer === void 0 ? void 0 : peer.peg) : super.same(peer);
        return out;
    }
    gen(_ctx) {
        return undefined;
    }
}
exports.ScalarTypeVal = ScalarTypeVal;
class ScalarVal extends ValBase_1.ValBase {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isScalarVal = true;
        this.type = spec.type;
        this.done = type_1.DONE;
    }
    clone(spec, ctx) {
        let out = super.clone({
            peg: this.peg,
            type: this.type,
            ...(spec || {})
        }, ctx);
        return out;
    }
    unify(peer, ctx) {
        // Exactly equal scalars are handled in op/unite
        if (peer === null || peer === void 0 ? void 0 : peer.isScalarTypeVal) {
            return peer.unify(this, ctx);
        }
        else if (peer.top) {
            return this;
        }
        return Nil_1.Nil.make(ctx, 'scalar', this, peer);
    }
    get canon() {
        return this.peg.toString();
    }
    same(peer) {
        return (peer === null || peer === void 0 ? void 0 : peer.isScalarVal) ? peer.peg === this.peg : super.same(peer);
    }
    gen(_ctx) {
        return this.peg;
    }
}
class NumberVal extends ScalarVal {
    constructor(spec, ctx) {
        super({ peg: spec.peg, type: Number }, ctx);
        this.isNumberVal = true;
    }
    unify(peer, ctx) {
        if (null != peer) {
            if (peer.isScalarTypeVal && peer.type === Number) {
                return this;
            }
            else if (peer.isScalarVal &&
                peer.peg === this.peg) {
                return peer.isIntegerVal ? peer : this;
            }
        }
        return super.unify(peer, ctx);
    }
}
exports.NumberVal = NumberVal;
class IntegerVal extends ScalarVal {
    constructor(spec, ctx) {
        if (!Number.isInteger(spec.peg)) {
            // TODO: use Nil?
            throw new Error('not-integer');
        }
        super({ peg: spec.peg, type: Integer }, ctx);
        this.isIntegerVal = true;
    }
    unify(peer, ctx) {
        if (null != peer) {
            if (peer.isScalarTypeVal && (peer.peg === Number || peer.peg === Integer)) {
                return this;
            }
            else if (peer.isScalarVal &&
                // peer.type === Number &&
                peer.peg === this.peg) {
                return this;
            }
        }
        return super.unify(peer, ctx);
    }
}
exports.IntegerVal = IntegerVal;
class StringVal extends ScalarVal {
    constructor(spec, ctx) {
        super({ peg: spec.peg, type: String }, ctx);
        this.isStringVal = true;
    }
    unify(peer, ctx) {
        return super.unify(peer, ctx);
    }
    get canon() {
        return JSON.stringify(this.peg);
    }
}
exports.StringVal = StringVal;
class BooleanVal extends ScalarVal {
    constructor(spec, ctx) {
        super({ peg: spec.peg, type: Boolean }, ctx);
        this.isBooleanVal = true;
    }
    unify(peer, ctx) {
        return super.unify(peer, ctx);
    }
}
exports.BooleanVal = BooleanVal;
BooleanVal.TRUE = new BooleanVal({ peg: true }, new unify_1.Context({ vc: 1, root: TOP }));
BooleanVal.FALSE = new BooleanVal({ peg: false }, new unify_1.Context({ vc: 2, root: TOP }));

},{"./lang":3,"./type":7,"./unify":8,"./val/Nil":14,"./val/ValBase":17}],10:[function(require,module,exports){
"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConjunctVal = exports.norm = void 0;
const type_1 = require("../type");
const err_1 = require("../err");
const op_1 = require("../op/op");
const val_1 = require("../val");
// import { DisjunctVal } from '../val/DisjunctVal'
const ListVal_1 = require("../val/ListVal");
const MapVal_1 = require("../val/MapVal");
const Nil_1 = require("../val/Nil");
// import { PrefVal } from '../val/PrefVal'
const RefVal_1 = require("../val/RefVal");
const ValBase_1 = require("../val/ValBase");
// TODO: move main logic to op/conjunct
class ConjunctVal extends ValBase_1.ValBase {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isConjunctVal = true;
        // console.log('NEWCJ')
        // console.trace()
    }
    // NOTE: mutation!
    append(peer) {
        this.peg.push(peer);
        return this;
    }
    unify(peer, ctx) {
        // console.log('CONJUNCT UNIFY', this.done, this.path.join('.'), this.canon,
        //   'P', peer.top || peer.constructor.name,
        //  peer.done, peer.path.join('.'), peer.canon)
        const mark = (Math.random() * 1e7) % 1e6 | 0;
        // console.log('CONJUNCT unify', mark, this.done, this.canon, 'peer=', peer.canon)
        let done = true;
        // Unify each term of conjunct against peer
        let upeer = [];
        // console.log('CJa' + mark, this.peg.map((p: Val) => p.canon), 'p=', peer.canon)
        for (let vI = 0; vI < this.peg.length; vI++) {
            upeer[vI] = (0, op_1.unite)(ctx, this.peg[vI], peer, 'cj-own' + mark);
            // let prevdone = done
            done = done && (type_1.DONE === upeer[vI].done);
            // console.log('CONJUNCT pud', mark, vI, done, prevdone, '|', upeer[vI].done, upeer[vI].canon)
            if (upeer[vI] instanceof Nil_1.Nil) {
                return Nil_1.Nil.make(ctx, '&peer[' + upeer[vI].canon + ',' + peer.canon + ']', this.peg[vI], peer);
            }
        }
        upeer = norm(upeer);
        // console.log('CONJUNCT upeer', this.id, mark, this.done, done, upeer.map(p => p.canon))
        upeer.sort((a, b) => {
            return (a.constructor.name === b.constructor.name) ? 0 :
                (a.constructor.name < b.constructor.name ? -1 : 1);
        });
        // console.log('CONJUNCT upeer sort', this.id, mark, this.done, done, upeer.map(p => p.canon))
        // Unify terms against each other
        let outvals = [];
        let val;
        // for (let pI = 0; pI < upeer.length; pI++) {
        //   let pt = upeer[pI]
        //   for (let qI = pI; qI < upeer.length; qI++) {
        //     let qt = upeer[pI]
        //     let pq = unite(ctx, pt, qt, 'cj-pq')
        //   }
        // }
        // console.log('CJ upeer', mark, upeer.map(v => v.canon))
        let t0 = upeer[0];
        next_term: for (let pI = 0; pI < upeer.length; pI++) {
            // console.log('CJ TERM t0', pI, t0.done, t0.canon)
            if (type_1.DONE !== t0.done) {
                let u0 = (0, op_1.unite)(ctx, t0, val_1.TOP, 'cj-peer-t0');
                if (type_1.DONE !== u0.done
                    // Maps and Lists are still unified so that path refs will work
                    // TODO: || ListVal - test!
                    && !(u0 instanceof MapVal_1.MapVal
                        || u0 instanceof ListVal_1.ListVal
                        || u0 instanceof RefVal_1.RefVal)) {
                    // console.log('CONJUNCT PUSH A', u0.id, u0.canon)
                    outvals.push(u0);
                    // console.log('CJ outvals A', outvals.map(v => v.canon))
                    continue next_term;
                }
                else {
                    t0 = u0;
                }
            }
            let t1 = upeer[pI + 1];
            // console.log('CJ TERM t1', pI + 1, t1?.done, t1?.canon)
            if (null == t1) {
                // console.log('CONJUNCT PUSH B', t0.canon)
                outvals.push(t0);
                // console.log('CJ outvals B', outvals.map(v => v.canon))
            }
            // Can't unite with a RefVal, unless also a RefVal with same path.
            else if (t0 instanceof RefVal_1.RefVal && !(t1 instanceof RefVal_1.RefVal)) {
                // console.log('CONJUNCT PUSH D', t0.canon)
                outvals.push(t0);
                t0 = t1;
                // console.log('CJ outvals C', outvals.map(v => v.canon))
            }
            else if (t1 instanceof RefVal_1.RefVal && !(t0 instanceof RefVal_1.RefVal)) {
                // console.log('CONJUNCT PUSH D', t0.canon)
                outvals.push(t0);
                t0 = t1;
                // console.log('CJ outvals C', outvals.map(v => v.canon))
            }
            else {
                val = (0, op_1.unite)(ctx, t0, t1, 'cj-peer-t0t1');
                done = done && type_1.DONE === val.done;
                // Unite was just a conjunt anyway, so discard.
                if (val instanceof ConjunctVal) {
                    // if (t0.id === val.peg[0].id) {
                    // val = t0
                    outvals.push(t0);
                    t0 = t1;
                    // console.log('CJ outvals D', outvals.map(v => v.canon))
                    //}
                }
                else if (val instanceof Nil_1.Nil) {
                    return val;
                }
                else {
                    t0 = val;
                }
                // TODO: t0 should become this to avoid unnecessary repasses
                // console.log('CONJUNCT PUSH C', val.canon)
                // outvals.push(val)
                // pI++
            }
        }
        // console.log('CJ outvals', mark, outvals.map(v => v.canon))
        let out;
        if (0 === outvals.length) {
            // Empty conjuncts evaporate.
            out = val_1.TOP;
        }
        // TODO: corrects CV[CV[1&/x]] issue above, but swaps term order!
        else if (1 === outvals.length) {
            out = outvals[0];
        }
        else {
            out = new ConjunctVal({ peg: outvals }, ctx);
        }
        out.done = done ? type_1.DONE : this.done + 1;
        // console.log('CJ out', out.done, out.canon)
        return out;
    }
    clone(spec, ctx) {
        let out = super.clone(spec, ctx);
        out.peg = this.peg.map((entry) => entry.clone(null, ctx));
        return out;
    }
    // TODO: need a well-defined val order so conjunt canon is always the same
    get canon() {
        // return '  C( ' + this.peg.map((v: Val) => v.canon).join('&') + ' )  '
        return this.peg.map((v) => v.canon).join('&');
    }
    gen(ctx) {
        // Unresolved conjunct cannot be generated, so always an error.
        let nil = Nil_1.Nil.make(ctx, 'conjunct', this, // (formatPath(this.peg, this.absolute) as any),
        undefined);
        // TODO: refactor to use Site
        nil.path = this.path;
        nil.url = this.url;
        nil.row = this.row;
        nil.col = this.col;
        (0, err_1.descErr)(nil);
        if (ctx) {
            ctx.err.push(nil);
        }
        else {
            throw new Error(nil.msg);
        }
        return undefined;
    }
}
exports.ConjunctVal = ConjunctVal;
// Normalize Conjuct:
// - flatten child conjuncts
function norm(terms) {
    let expand = [];
    for (let tI = 0, pI = 0; tI < terms.length; tI++, pI++) {
        if (terms[tI] instanceof ConjunctVal) {
            expand.push(...terms[tI].peg);
            pI += terms[tI].peg.length - 1;
        }
        else {
            expand[pI] = terms[tI];
        }
    }
    return expand;
}
exports.norm = norm;

},{"../err":2,"../op/op":5,"../type":7,"../val":9,"../val/ListVal":12,"../val/MapVal":13,"../val/Nil":14,"../val/RefVal":16,"../val/ValBase":17}],11:[function(require,module,exports){
"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisjunctVal = void 0;
const type_1 = require("../type");
const op_1 = require("../op/op");
// import { TOP } from '../val'
// import { ConjunctVal } from '../val/ConjunctVal'
// import { ListVal } from '../val/ListVal'
// import { MapVal } from '../val/MapVal'
const Nil_1 = require("../val/Nil");
const PrefVal_1 = require("../val/PrefVal");
// import { RefVal } from '../val/RefVal'
const ValBase_1 = require("../val/ValBase");
// TODO: move main logic to op/disjunct
class DisjunctVal extends ValBase_1.ValBase {
    // TODO: sites from normalization of orginal Disjuncts, as well as child pegs
    constructor(spec, ctx, _sites) {
        super(spec, ctx);
        this.isDisjunctVal = true;
    }
    // NOTE: mutation!
    append(peer) {
        this.peg.push(peer);
        return this;
    }
    unify(peer, ctx) {
        let done = true;
        let oval = [];
        // console.log('oval', this.canon, peer.canon)
        // Conjunction (&) distributes over disjunction (|)
        for (let vI = 0; vI < this.peg.length; vI++) {
            //oval[vI] = this.peg[vI].unify(peer, ctx)
            oval[vI] = (0, op_1.unite)(ctx, this.peg[vI], peer);
            // console.log('ovalA', vI, this.peg[vI].canon, peer.canon, oval[vI].canon)
            done = done && type_1.DONE === oval[vI].done;
        }
        // console.log('ovalB', oval.map(v => v.canon))
        // Remove duplicates, and normalize
        if (1 < oval.length) {
            for (let vI = 0; vI < oval.length; vI++) {
                if (oval[vI] instanceof DisjunctVal) {
                    oval.splice(vI, 1, ...oval[vI].peg);
                }
            }
            //console.log('ovalC', oval.map(v => v.canon))
            // TODO: not an error Nil!
            let remove = new Nil_1.Nil();
            for (let vI = 0; vI < oval.length; vI++) {
                for (let kI = vI + 1; kI < oval.length; kI++) {
                    if (oval[kI].same(oval[vI])) {
                        oval[kI] = remove;
                    }
                }
            }
            //console.log('ovalD', oval.map(v => v.canon))
            oval = oval.filter(v => !(v instanceof Nil_1.Nil));
        }
        let out;
        if (1 == oval.length) {
            out = oval[0];
        }
        else if (0 == oval.length) {
            return Nil_1.Nil.make(ctx, '|:empty', this);
        }
        else {
            out = new DisjunctVal({ peg: oval }, ctx);
        }
        out.done = done ? type_1.DONE : this.done + 1;
        return out;
    }
    clone(spec, ctx) {
        let out = super.clone(spec, ctx);
        out.peg = this.peg.map((entry) => entry.clone(null, ctx));
        return out;
    }
    get canon() {
        return this.peg.map((v) => v.canon).join('|');
    }
    gen(ctx) {
        // TODO: this is not right - unresolved Disjuncts eval to undef
        if (0 < this.peg.length) {
            let vals = this.peg.filter((v) => v instanceof PrefVal_1.PrefVal);
            vals = 0 === vals.length ? this.peg : vals;
            // console.log(vals.map((m: any) => m.canon))
            let val = vals[0];
            for (let vI = 1; vI < this.peg.length; vI++) {
                // val = val.unify(this.peg[vI], ctx)
                let valnext = val.unify(this.peg[vI], ctx);
                // console.log(valnext.canon, val.canon, this.peg[vI].canon, val, this.peg[vI])
                val = valnext;
            }
            return val.gen(ctx);
        }
        return undefined;
    }
}
exports.DisjunctVal = DisjunctVal;

},{"../op/op":5,"../type":7,"../val/Nil":14,"../val/PrefVal":15,"../val/ValBase":17}],12:[function(require,module,exports){
"use strict";
/* Copyright (c) 2021-2022 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListVal = void 0;
const type_1 = require("../type");
const op_1 = require("../op/op");
const val_1 = require("../val");
const ConjunctVal_1 = require("../val/ConjunctVal");
// import { DisjunctVal } from '../val/DisjunctVal'
// import { MapVal } from '../val/MapVal'
const Nil_1 = require("../val/Nil");
// import { PrefVal } from '../val/PrefVal'
// import { RefVal } from '../val/RefVal'
const ValBase_1 = require("../val/ValBase");
class ListVal extends ValBase_1.ValBase {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isListVal = true;
        this.spread = {
            cj: undefined,
        };
        if (null == this.peg) {
            throw new Error('ListVal spec.peg undefined');
        }
        let spread = this.peg[ListVal.SPREAD];
        delete this.peg[ListVal.SPREAD];
        if (spread) {
            if ('&' === spread.o) {
                // TODO: handle existing spread!
                this.spread.cj =
                    Array.isArray(spread.v) ?
                        1 < spread.v.length ?
                            new ConjunctVal_1.ConjunctVal({ peg: spread.v }, ctx) :
                            spread.v :
                        spread.v;
                // let tmv = Array.isArray(spread.v) ? spread.v : [spread.v]
                // this.spread.cj = new ConjunctVal({ peg: tmv }, ctx)
            }
        }
    }
    // NOTE: order of keys is not preserved!
    // not possible in any case - consider {a,b} unify {b,a}
    unify(peer, ctx) {
        let done = true;
        let out = val_1.TOP === peer ? this : new ListVal({ peg: [] }, ctx);
        out.spread.cj = this.spread.cj;
        if (peer instanceof ListVal) {
            out.spread.cj = null == out.spread.cj ? peer.spread.cj : (null == peer.spread.cj ? out.spread.cj : (out.spread.cj =
                // new ConjunctVal({ peg: [out.spread.cj, peer.spread.cj] }, ctx)
                (0, op_1.unite)(ctx, out.spread.cj, peer.spread.cj)));
        }
        out.done = this.done + 1;
        // if (this.spread.cj) {
        //   out.spread.cj =
        //     DONE !== this.spread.cj.done ? unite(ctx, this.spread.cj) :
        //       this.spread.cj
        // }
        let spread_cj = out.spread.cj || val_1.TOP;
        // Always unify children first
        for (let key in this.peg) {
            let keyctx = ctx.descend(key);
            let key_spread_cj = spread_cj.clone(null, keyctx);
            out.peg[key] = (0, op_1.unite)(keyctx, this.peg[key], key_spread_cj, 'list-own');
            done = (done && type_1.DONE === out.peg[key].done);
        }
        if (peer instanceof ListVal) {
            let upeer = (0, op_1.unite)(ctx, peer, undefined, 'list-peer-list');
            // NOTE: peerkey is the index
            for (let peerkey in upeer.peg) {
                let peerchild = upeer.peg[peerkey];
                let child = out.peg[peerkey];
                let oval = out.peg[peerkey] =
                    undefined === child ? peerchild :
                        child instanceof Nil_1.Nil ? child :
                            peerchild instanceof Nil_1.Nil ? peerchild :
                                (0, op_1.unite)(ctx.descend(peerkey), child, peerchild, 'list-peer');
                if (this.spread.cj) {
                    let key_ctx = ctx.descend(peerkey);
                    let key_spread_cj = spread_cj.clone(null, key_ctx);
                    // out.peg[peerkey] = unite(ctx, out.peg[peerkey], spread_cj)
                    oval = out.peg[peerkey] =
                        // new ConjunctVal({ peg: [out.peg[peerkey], key_spread_cj] }, key_ctx)
                        // done = false
                        (0, op_1.unite)(key_ctx, out.peg[peerkey], key_spread_cj);
                }
                done = (done && type_1.DONE === oval.done);
            }
        }
        else if (val_1.TOP !== peer) {
            return Nil_1.Nil.make(ctx, 'map', this, peer);
        }
        out.done = done ? type_1.DONE : out.done;
        return out;
    }
    clone(spec, ctx) {
        let out = super.clone(spec, ctx);
        out.peg = this.peg.map((entry) => entry.clone(null, ctx));
        if (this.spread.cj) {
            out.spread.cj = this.spread.cj.clone(null, ctx);
        }
        return out;
    }
    get canon() {
        let keys = Object.keys(this.peg);
        return '[' +
            (this.spread.cj ? '&:' + this.spread.cj.canon +
                (0 < keys.length ? ',' : '') : '') +
            keys
                // NOTE: handle array non-index key vals
                // .map(k => [JSON.stringify(k) + ':' + this.peg[k].canon]).join(',') +
                .map(k => [this.peg[k].canon]).join(',') +
            ']';
    }
    gen(ctx) {
        let out = this.peg.map((v) => v.gen(ctx));
        // for (let p in this.peg) {
        //   out[p] = this.peg[p].gen(ctx)
        // }
        return out;
    }
}
exports.ListVal = ListVal;
ListVal.SPREAD = Symbol('spread');

},{"../op/op":5,"../type":7,"../val":9,"../val/ConjunctVal":10,"../val/Nil":14,"../val/ValBase":17}],13:[function(require,module,exports){
"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapVal = void 0;
const type_1 = require("../type");
const op_1 = require("../op/op");
const val_1 = require("../val");
const ConjunctVal_1 = require("../val/ConjunctVal");
// import { DisjunctVal } from '../val/DisjunctVal'
// import { ListVal } from '../val/ListVal'
const Nil_1 = require("../val/Nil");
// import { PrefVal } from '../val/PrefVal'
// import { RefVal } from '../val/RefVal'
const ValBase_1 = require("../val/ValBase");
class MapVal extends ValBase_1.ValBase {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isMapVal = true;
        this.spread = {
            cj: undefined,
        };
        if (null == this.peg) {
            throw new Error('MapVal spec.peg undefined');
        }
        let spread = this.peg[MapVal.SPREAD];
        delete this.peg[MapVal.SPREAD];
        // console.log('MC', this.id, peg, spread)
        if (spread) {
            if ('&' === spread.o) {
                // TODO: handle existing spread!
                this.spread.cj =
                    Array.isArray(spread.v) ?
                        1 < spread.v.length ?
                            new ConjunctVal_1.ConjunctVal({ peg: spread.v }, ctx) :
                            spread.v[0] :
                        spread.v;
                // let tmv = Array.isArray(spread.v) ? spread.v : [spread.v]
                // this.spread.cj = new ConjunctVal({ peg: tmv }, ctx)
            }
        }
    }
    // NOTE: order of keys is not preserved!
    // not possible in any case - consider {a,b} unify {b,a}
    unify(peer, ctx) {
        // let mark = Math.random()
        let done = true;
        let out = val_1.TOP === peer ? this : new MapVal({ peg: {} }, ctx);
        out.spread.cj = this.spread.cj;
        if (peer instanceof MapVal) {
            out.spread.cj = null == out.spread.cj ? peer.spread.cj : (null == peer.spread.cj ? out.spread.cj : (out.spread.cj =
                // new ConjunctVal({ peg: [out.spread.cj, peer.spread.cj] }, ctx)
                (0, op_1.unite)(ctx, out.spread.cj, peer.spread.cj)));
        }
        out.done = this.done + 1;
        let spread_cj = out.spread.cj || val_1.TOP;
        // Always unify own children first
        for (let key in this.peg) {
            let keyctx = ctx.descend(key);
            let key_spread_cj = spread_cj.clone(null, keyctx);
            // console.log('M0', this.id, mark, Object.keys(this.peg).join('~'),
            //   'p=', this.path.join('.'),
            //   'k=', key, peer.top || peer.constructor.name,
            //   'pp=', this.peg[key].path.join('.'),
            //   this.peg[key].canon,
            //   'sp=', key_spread_cj.path.join('.'),
            //   key_spread_cj.canon)
            // if (1000000000 === this.id) {
            //   console.dir(key_spread_cj, { depth: null })
            // }
            out.peg[key] = (0, op_1.unite)(keyctx, this.peg[key], key_spread_cj, 'map-own');
            done = (done && type_1.DONE === out.peg[key].done);
        }
        if (peer instanceof MapVal) {
            let upeer = (0, op_1.unite)(ctx, peer, undefined, 'map-peer-map');
            for (let peerkey in upeer.peg) {
                // console.log('M1', this.id, mark, Object.keys(this.peg).join('~'),
                //   'pk=', peerkey)
                let peerchild = upeer.peg[peerkey];
                let child = out.peg[peerkey];
                let oval = out.peg[peerkey] =
                    undefined === child ? peerchild :
                        child instanceof Nil_1.Nil ? child :
                            peerchild instanceof Nil_1.Nil ? peerchild :
                                (0, op_1.unite)(ctx.descend(peerkey), child, peerchild, 'map-peer');
                if (this.spread.cj) {
                    let key_ctx = ctx.descend(peerkey);
                    let key_spread_cj = spread_cj.clone(null, key_ctx);
                    oval = out.peg[peerkey] =
                        // new ConjunctVal({ peg: [out.peg[peerkey], key_spread_cj] }, key_ctx)
                        // done = false
                        (0, op_1.unite)(key_ctx, out.peg[peerkey], key_spread_cj);
                }
                // else {
                done = (done && type_1.DONE === oval.done);
                // }
            }
        }
        else if (val_1.TOP !== peer) {
            return Nil_1.Nil.make(ctx, 'map', this, peer);
        }
        out.done = done ? type_1.DONE : out.done;
        return out;
    }
    clone(spec, ctx) {
        let out = super.clone(spec, ctx);
        out.peg = {};
        for (let entry of Object.entries(this.peg)) {
            out.peg[entry[0]] =
                entry[1] instanceof ValBase_1.ValBase ? entry[1].clone(null, ctx) : entry[1];
        }
        if (this.spread.cj) {
            out.spread.cj = this.spread.cj.clone(null, ctx);
        }
        return out;
    }
    get canon() {
        let keys = Object.keys(this.peg);
        return '{' +
            (this.spread.cj ? '&:' + this.spread.cj.canon +
                (0 < keys.length ? ',' : '') : '') +
            keys
                .map(k => [JSON.stringify(k) + ':' + this.peg[k].canon]).join(',') +
            '}';
    }
    gen(ctx) {
        let out = {};
        for (let p in this.peg) {
            out[p] = this.peg[p].gen(ctx);
        }
        return out;
    }
}
exports.MapVal = MapVal;
MapVal.SPREAD = Symbol('spread');

},{"../op/op":5,"../type":7,"../val":9,"../val/ConjunctVal":10,"../val/Nil":14,"../val/ValBase":17}],14:[function(require,module,exports){
"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Nil = void 0;
const type_1 = require("../type");
const err_1 = require("../err");
const ValBase_1 = require("../val/ValBase");
class Nil extends ValBase_1.ValBase {
    constructor(spec, ctx) {
        super(spec && 'string' !== typeof spec ? spec : {}, ctx);
        this.isNil = true;
        this.nil = true;
        this.msg = '';
        if (spec && 'object' === typeof spec) {
            this.why = spec === null || spec === void 0 ? void 0 : spec.why;
            this.msg = 'string' === typeof (spec === null || spec === void 0 ? void 0 : spec.msg) ? spec.msg : this.msg;
            this.err = spec ? (Array.isArray(spec.err) ? [...spec.err] : [spec.err]) : [];
        }
        // Nil is always DONE, by definition.
        this.done = type_1.DONE;
    }
    unify(_peer, _ctx) {
        return this;
    }
    clone(spec, ctx) {
        let out = super.clone(spec, ctx);
        out.why = this.why;
        // Should these clone?
        // out.primary = this.primary?.clone()
        // out.secondary = this.secondary?.clone()
        out.primary = this.primary;
        out.secondary = this.secondary;
        out.msg = this.msg;
        return out;
    }
    get canon() {
        return 'nil';
    }
    gen(ctx) {
        // Unresolved nil cannot be generated, so always an error.
        (0, err_1.descErr)(this);
        if (ctx) {
            ctx.err.push(this);
        }
        else {
            throw new Error(this.msg);
        }
        return undefined;
    }
}
exports.Nil = Nil;
// TODO: include Val generating nil, thus capture type
// A Nil is an error - should not happen - unify failed
// refactor ,make(spec,ctx)
Nil.make = (ctx, why, av, bv) => {
    let nil = new Nil({ why }, ctx);
    // TODO: this should be done lazily, for multiple terms
    // Terms later in same file are considered the primary error location.
    if (null != av) {
        nil.row = av.row;
        nil.col = av.col;
        nil.url = av.url;
        nil.primary = av;
        if (null != bv) {
            nil.secondary = bv;
            let bv_loc_wins = (nil.url === bv.url) && ((nil.row < bv.row) ||
                (nil.row === bv.row && nil.col < bv.col));
            if (bv_loc_wins) {
                nil.row = bv.row;
                nil.col = bv.col;
                nil.url = bv.url;
                nil.primary = bv;
                nil.secondary = av;
            }
        }
    }
    if (ctx) {
        ctx.err.push(nil);
    }
    return nil;
};

},{"../err":2,"../type":7,"../val/ValBase":17}],15:[function(require,module,exports){
"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrefVal = void 0;
const type_1 = require("../type");
const err_1 = require("../err");
const op_1 = require("../op/op");
// import { TOP } from '../val'
// import { ConjunctVal } from '../val/ConjunctVal'
// import { DisjunctVal } from '../val/DisjunctVal'
// import { ListVal } from '../val/ListVal'
// import { MapVal } from '../val/MapVal'
const Nil_1 = require("../val/Nil");
// import { RefVal } from '../val/RefVal'
const ValBase_1 = require("../val/ValBase");
class PrefVal extends ValBase_1.ValBase {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isPrefVal = true;
        this.pref = spec.pref || spec.peg;
    }
    // PrefVal unify always returns a PrefVal
    // PrefVals can only be removed by becoming Nil in a Disjunct
    unify(peer, ctx) {
        let done = true;
        let out;
        if (peer instanceof PrefVal) {
            out = new PrefVal({
                peg: (0, op_1.unite)(ctx, this.peg, peer.peg, 'Pref000'),
                pref: (0, op_1.unite)(ctx, this.pref, peer.pref, 'Pref010'),
            }, ctx);
        }
        else {
            out = new PrefVal({
                // TODO: find a better way to drop Nil non-errors
                peg: (0, op_1.unite)(ctx === null || ctx === void 0 ? void 0 : ctx.clone({ err: [] }), this.peg, peer, 'Pref020'),
                pref: (0, op_1.unite)(ctx === null || ctx === void 0 ? void 0 : ctx.clone({ err: [] }), this.pref, peer, 'Pref030'),
            }, ctx);
        }
        done = done && type_1.DONE === out.peg.done &&
            (null != out.pref ? type_1.DONE === out.pref.done : true);
        if (out.peg instanceof Nil_1.Nil) {
            out = out.pref;
        }
        else if (out.pref instanceof Nil_1.Nil) {
            out = out.peg;
        }
        out.done = done ? type_1.DONE : this.done + 1;
        return out;
    }
    same(peer) {
        if (null == peer) {
            return false;
        }
        let pegsame = (this.peg === peer.peg) ||
            (this.peg instanceof ValBase_1.ValBase && this.peg.same(peer.peg));
        let prefsame = peer instanceof PrefVal &&
            ((this.pref === peer.pref) ||
                (this.pref instanceof ValBase_1.ValBase && this.pref.same(peer.pref)));
        return pegsame && prefsame;
    }
    clone(spec, ctx) {
        let out = super.clone(spec, ctx);
        out.pref = this.pref.clone(null, ctx);
        return out;
    }
    get canon() {
        return this.pref instanceof Nil_1.Nil ? this.peg.canon : '*' + this.pref.canon;
    }
    gen(ctx) {
        let val = !(this.pref instanceof Nil_1.Nil) ? this.pref :
            (!(this.peg instanceof Nil_1.Nil) ? this.peg :
                this.pref);
        if (val instanceof Nil_1.Nil) {
            (0, err_1.descErr)(val);
            if (ctx) {
                ctx.err.push(val);
            }
            else {
                throw new Error(val.msg);
            }
        }
        return val.gen(ctx);
    }
}
exports.PrefVal = PrefVal;

},{"../err":2,"../op/op":5,"../type":7,"../val/Nil":14,"../val/ValBase":17}],16:[function(require,module,exports){
"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefVal = void 0;
const type_1 = require("../type");
const err_1 = require("../err");
const op_1 = require("../op/op");
const val_1 = require("../val");
const ConjunctVal_1 = require("../val/ConjunctVal");
// import { DisjunctVal } from '../val/DisjunctVal'
// import { ListVal } from '../val/ListVal'
const MapVal_1 = require("../val/MapVal");
const Nil_1 = require("../val/Nil");
const VarVal_1 = require("../val/VarVal");
const ValBase_1 = require("../val/ValBase");
class RefVal extends ValBase_1.ValBase {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isRefVal = true;
        this.absolute = false;
        this.prefix = false;
        this.peg = [];
        this.absolute = true === this.absolute ? true : // absolute sticks
            true === spec.absolute ? true : false;
        this.prefix = true === spec.prefix;
        for (let pI = 0; pI < spec.peg.length; pI++) {
            this.append(spec.peg[pI]);
        }
    }
    append(part) {
        // console.log('APPEND', part, this)
        let partval;
        if ('string' === typeof part) {
            partval = part;
            this.peg.push(partval);
        }
        else if (part instanceof val_1.StringVal) {
            partval = part.peg;
            this.peg.push(partval);
        }
        else if (part instanceof VarVal_1.VarVal) {
            partval = part;
            this.peg.push(partval);
        }
        else if (part instanceof RefVal) {
            if (part.absolute) {
                this.absolute = true;
            }
            if (this.prefix) {
                if (part.prefix) {
                    this.peg.push('.');
                }
            }
            else {
                if (part.prefix) {
                    if (0 === this.peg.length) {
                        this.prefix = true;
                    }
                    else if (0 < this.peg.length) {
                        this.peg.push('.');
                    }
                }
            }
            this.peg.push(...part.peg);
        }
    }
    unify(peer, ctx) {
        let out = this;
        // let why = 'id'
        if (this.id !== peer.id) {
            // TODO: not resolved when all Vals in path are done is an error
            // as path cannot be found
            // let resolved: Val | undefined = null == ctx ? this : ctx.find(this)
            let resolved = null == ctx ? this : this.find(ctx);
            // console.log('UR', this.peg, resolved)
            resolved = resolved || this;
            if (null == resolved && this.canon === peer.canon) {
                out = this;
            }
            else if (resolved instanceof RefVal) {
                if (val_1.TOP === peer) {
                    out = this;
                    // why = 'pt'
                }
                else if (peer instanceof Nil_1.Nil) {
                    out = Nil_1.Nil.make(ctx, 'ref[' + this.peg + ']', this, peer);
                    // why = 'pn'
                }
                // same path
                // else if (this.peg === peer.peg) {
                else if (this.canon === peer.canon) {
                    out = this;
                    // why = 'pp'
                }
                else {
                    // Ensure RefVal done is incremented
                    this.done = type_1.DONE === this.done ? type_1.DONE : this.done + 1;
                    out = new ConjunctVal_1.ConjunctVal({ peg: [this, peer] }, ctx);
                    // why = 'cj'
                }
            }
            else {
                out = (0, op_1.unite)(ctx, resolved, peer, 'ref');
                // why = 'u'
            }
            out.done = type_1.DONE === out.done ? type_1.DONE : this.done + 1;
        }
        // console.log('RV', why, this.id, this.canon, '&', peer.canon, '->', out.canon)
        return out;
    }
    find(ctx) {
        // TODO: relative paths
        // if (this.root instanceof MapVal && ref.absolute) {
        // NOTE: path *to* the ref, not the ref itself!
        let fullpath = this.path;
        let parts = [];
        let modes = [];
        // console.log('PARTS', this.peg)
        for (let pI = 0; pI < this.peg.length; pI++) {
            let part = this.peg[pI];
            if (part instanceof VarVal_1.VarVal) {
                let strval = part.peg;
                let name = strval ? '' + strval.peg : '';
                if ('KEY' === name) {
                    if (pI === this.peg.length - 1) {
                        modes.push(name);
                    }
                    else {
                        // TODO: return a Nil explaining error
                        return;
                    }
                }
                if ('SELF' === name) {
                    if (pI === 0) {
                        modes.push(name);
                    }
                    else {
                        // TODO: return a Nil explaining error
                        return;
                    }
                }
                else if ('PARENT' === name) {
                    if (pI === 0) {
                        modes.push(name);
                    }
                    else {
                        // TODO: return a Nil explaining error
                        return;
                    }
                }
                else if (0 === modes.length) {
                    part = part.unify(val_1.TOP, ctx);
                    if (part instanceof Nil_1.Nil) {
                        // TODO: var not found, so can't find path
                        return;
                    }
                    else {
                        part = '' + part.peg;
                    }
                }
            }
            else {
                parts.push(part);
            }
        }
        // console.log('modes', modes)
        if (this.absolute) {
            fullpath = parts;
        }
        else {
            fullpath = fullpath.slice(0, (modes.includes('SELF') ? 0 :
                modes.includes('PARENT') ? -1 :
                    -1 // siblings
            )).concat(parts);
        }
        let sep = '.';
        fullpath = fullpath
            .reduce(((a, p) => (p === sep ? a.length = a.length - 1 : a.push(p), a)), []);
        let node = ctx.root;
        let pI = 0;
        for (; pI < fullpath.length; pI++) {
            let part = fullpath[pI];
            if (node instanceof MapVal_1.MapVal) {
                node = node.peg[part];
            }
            else {
                break;
            }
        }
        if (pI === fullpath.length) {
            // if (this.attr && 'KEY' === this.attr.kind) {
            if (modes.includes('KEY')) {
                // let key = fullpath[fullpath.length - ('' === this.attr.part ? 1 : 2)]
                let key = fullpath[fullpath.length - 1];
                let sv = new val_1.StringVal({ peg: null == key ? '' : key }, ctx);
                // TODO: other props?
                sv.done = type_1.DONE;
                sv.path = this.path;
                return sv;
            }
            else {
                return node;
            }
        }
    }
    same(peer) {
        return null == peer ? false : this.peg === peer.peg;
    }
    clone(spec, ctx) {
        let out = super.clone({
            peg: this.peg,
            absolute: this.absolute,
            ...(spec || {})
        }, ctx);
        return out;
    }
    get canon() {
        let str = (this.absolute ? '$' : '') +
            (0 < this.peg.length ? '.' : '') +
            // this.peg.join(this.sep)
            this.peg.map((p) => '.' === p ? '' :
                (p.isVal ? p.canon : '' + p))
                .join('.');
        return str;
    }
    gen(ctx) {
        // Unresolved ref cannot be generated, so always an error.
        let nil = Nil_1.Nil.make(ctx, 'ref', this, // (formatPath(this.peg, this.absolute) as any),
        undefined);
        // TODO: refactor to use Site
        nil.path = this.path;
        nil.url = this.url;
        nil.row = this.row;
        nil.col = this.col;
        (0, err_1.descErr)(nil);
        if (ctx) {
            ctx.err.push(nil);
        }
        else {
            throw new Error(nil.msg);
        }
        return undefined;
    }
}
exports.RefVal = RefVal;

},{"../err":2,"../op/op":5,"../type":7,"../val":9,"../val/ConjunctVal":10,"../val/MapVal":13,"../val/Nil":14,"../val/ValBase":17,"../val/VarVal":18}],17:[function(require,module,exports){
"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValBase = void 0;
const lang_1 = require("../lang");
class ValBase {
    // deps?: any
    constructor(spec, ctx) {
        this.isVal = true;
        this.done = 0;
        this.path = [];
        this.row = -1;
        this.col = -1;
        this.url = '';
        this.top = false;
        // Actual native value.
        this.peg = undefined;
        // TODO: used for top level result - not great
        this.err = [];
        this.peg = spec === null || spec === void 0 ? void 0 : spec.peg;
        this.path = (ctx === null || ctx === void 0 ? void 0 : ctx.path) || [];
        this.id = (9e9 + Math.floor(Math.random() * (1e9)));
    }
    same(peer) {
        return null == peer ? false : this.id === peer.id;
    }
    clone(spec, ctx) {
        let cloneCtx = ctx ? ctx.clone({
            path: ctx.path.concat(this.path.slice(ctx.path.length))
        }) : undefined;
        let out = new this
            .constructor(spec || { peg: this.peg }, cloneCtx);
        if (null == cloneCtx) {
            out.path = this.path.slice(0);
        }
        return out;
    }
    get site() {
        return new lang_1.Site(this);
    }
    unify(_peer, _ctx) { return this; }
    get canon() { return ''; }
    gen(_ctx) { return null; }
}
exports.ValBase = ValBase;

},{"../lang":3}],18:[function(require,module,exports){
"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VarVal = void 0;
const type_1 = require("../type");
const err_1 = require("../err");
const val_1 = require("../val");
// import { ConjunctVal } from '../val/ConjunctVal'
// import { DisjunctVal } from '../val/DisjunctVal'
// import { ListVal } from '../val/ListVal'
// import { MapVal } from '../val/MapVal'
const Nil_1 = require("../val/Nil");
const RefVal_1 = require("../val/RefVal");
const ValBase_1 = require("../val/ValBase");
// TODO: KEY, SELF, PARENT are reserved names - error
class VarVal extends ValBase_1.ValBase {
    constructor(spec, ctx) {
        super(spec, ctx);
        this.isVarVal = true;
    }
    unify(peer, ctx) {
        let out;
        let nameVal;
        if (this.peg.isVal) {
            // $.a.b.c - convert path to absolute
            if (this.peg instanceof RefVal_1.RefVal) {
                this.peg.absolute = true;
                nameVal = this.peg;
            }
            else {
                nameVal = this.peg.unify(peer);
            }
        }
        else {
            // TODO: how to pass row+col?
            nameVal = new val_1.StringVal({ peg: '' + this.peg }, ctx);
        }
        if (!(nameVal instanceof RefVal_1.RefVal) && type_1.DONE === nameVal.done) {
            if (nameVal instanceof val_1.StringVal) {
                out = ctx.var[nameVal.peg];
                if (null == out) {
                    out = Nil_1.Nil.make(ctx, 'var[' + nameVal.peg + ']', this, peer);
                }
            }
            else {
                out = Nil_1.Nil.make(ctx, 'var[' + typeof nameVal + ']', this, peer);
            }
        }
        else {
            out = nameVal;
        }
        return out;
    }
    same(peer) {
        return null == peer ? false : peer instanceof VarVal && this.peg === peer.peg;
    }
    clone(spec, ctx) {
        let out = super.clone(spec, ctx);
        return out;
    }
    get canon() {
        var _a;
        return '$' + (((_a = this.peg) === null || _a === void 0 ? void 0 : _a.isVal) ? this.peg.canon : '' + this.peg);
    }
    gen(ctx) {
        // Unresolved var cannot be generated, so always an error.
        let nil = Nil_1.Nil.make(ctx, 'var', this, undefined);
        // TODO: refactor to use Site
        nil.path = this.path;
        nil.url = this.url;
        nil.row = this.row;
        nil.col = this.col;
        (0, err_1.descErr)(nil);
        if (ctx) {
            ctx.err.push(nil);
        }
        else {
            throw new Error(nil.msg);
        }
        return undefined;
    }
}
exports.VarVal = VarVal;

},{"../err":2,"../type":7,"../val":9,"../val/Nil":14,"../val/RefVal":16,"../val/ValBase":17}],19:[function(require,module,exports){
(function (__dirname){(function (){
"use strict";
/* Copyright (c) 2020-2023 Richard Rodger and other contributors, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
let { Aontu, Lang, util } = require('../aontu');
// let { makeFileResolver } = require('@jsonic/multisource')
describe('aontu', function () {
    it('happy', async () => {
        let v0 = Aontu('a:1');
        expect(v0.canon).toEqual('{"a":1}');
        expect(Aontu('a:{b:1},a:{c:2}').canon).toEqual('{"a":{"b":1,"c":2}}');
        expect(Aontu('a:b:1,a:c:2').canon).toEqual('{"a":{"b":1,"c":2}}');
        expect(Aontu(`
a:{b:1}
a:{c:2}
`).canon).toEqual('{"a":{"b":1,"c":2}}');
        let p0 = new Lang();
        expect(p0.parse(`
u: { x: 1, y: number}
q: a: $.u
w: b: $.q.a & {y:2,z:3}
`).canon).toEqual('{"u":{"x":1,"y":number},"q":{"a":$.u},"w":{"b":$.q.a&{"y":2,"z":3}}}');
        expect(Aontu(`
q: a: { x: 1, y: number}
w0: b: $.q.a & {y:2,z:3}
w1: b: {y:2,z:3} & $.q.a
`).gen([])).toEqual({
            q: { a: { x: 1, y: undefined } },
            w0: { b: { x: 1, y: 2, z: 3 } },
            w1: { b: { x: 1, y: 2, z: 3 } },
        });
        // TODO: fix in jsonic
        expect(Aontu('{a:b:1\na:c:2}').canon).toEqual('{"a":{"b":1,"c":2}}');
    });
    it('util', async () => {
        expect(util.options('x')).toMatchObject({ src: 'x', print: 0 });
        expect(util.options('x', { print: 1 })).toMatchObject({ src: 'x', print: 1 });
        expect(util.options({ src: 'x' }, { print: 1 })).toMatchObject({
            src: 'x',
            print: 1,
        });
        expect(util.options({ src: 'x', print: 1 }, { src: 'y', print: 2 })).toMatchObject({ src: 'y', print: 2 });
    });
    it('file', async () => {
        let v0 = Aontu('@"' + __dirname + '/t02.jsonic"');
        // console.log('MAP', v0.map)
        //console.log(v0.canon)
        expect(v0.canon).toEqual('{"sys":{"ent":{"name":string}},"ent":{"foo":{"name":"foo","fields":{"f0":{"kind":"string"}}},"bar":{"name":"bar","fields":{"f0":{"kind":"number"}}}}}');
        expect(v0.gen([])).toEqual({
            sys: { ent: { name: undefined } },
            ent: {
                foo: {
                    name: 'foo',
                    fields: {
                        f0: {
                            kind: 'string',
                        },
                    },
                },
                bar: {
                    name: 'bar',
                    fields: {
                        f0: {
                            kind: 'number',
                        },
                    },
                },
            },
        });
    });
    it('pref', async () => {
        let v0 = Aontu('@"' + __dirname + '/t03.jsonic"', {
            // resolver: makeFileResolver(),
            base: __dirname,
        });
        //console.log(v0.canon)
        //console.dir(v0.gen([]),{depth:null})
        // expect(v0.canon).toEqual(
        //   '{"uxc":{"name":string,"size":integer|*1},"foo":{"name":string,"size":integer|*1},"bar":{"name":"bar","size":integer|*1},"zed":{"name":"zed","size":2},"qaz":{"name":"bar","size":nil}}'
        // )
        // expect(v0.gen([])).toEqual({
        //   uxc: { name: undefined, size: 1 },
        //   foo: { name: undefined, size: 1 },
        //   bar: { name: 'bar', size: 1 },
        //   zed: { name: 'zed', size: 2 },
        //   qaz: { name: 'bar', size: undefined },
        // })
    });
    it('map-spread', () => {
        let v0 = Aontu('c:{&:{x:2},y:{k:3},z:{k:4}}');
        //console.dir(v0,{depth:null})
        expect(v0.canon).toEqual('{"c":{&:{"x":2},"y":{"k":3,"x":2},"z":{"k":4,"x":2}}}');
        let v1 = Aontu('c:{&:{x:2},z:{k:4}},c:{y:{k:3}}');
        //console.dir(v0,{depth:null})
        expect(v1.canon).toEqual('{"c":{&:{"x":2},"z":{"k":4,"x":2},"y":{"k":3,"x":2}}}');
        let v10 = Aontu('a:{&:{x:1}},b:.a,b:{y:{k:2}},c:{&:{x:2}},c:{y:{k:3}}');
        //console.dir(v0,{depth:null})
        expect(v10.canon).toEqual('{"a":{&:{"x":1}},' +
            '"b":{&:{"x":1},"y":{"k":2,"x":1}},' +
            '"c":{&:{"x":2},"y":{"k":3,"x":2}}}');
    });
    it('empty-and-comments', () => {
        // TODO: fix
        // Avoid failures when model is commented out
        //     expect(Aontu('').gen()).toEqual({})
        //     expect(Aontu(`
        // # comment
        // `).gen()).toEqual({})
    });
    it('practical-path-spread', () => {
        let v0 = Aontu(`
micks: $.def.garage & {

  porsche: {
    color: silver
  }

  ferrari: {
    color: red
  }

  telsa: {
  }
}

def: car: {
  doors: *4 | number
  color: *green | string
}

def: garage: {
  &: $.def.car
}
`);
        expect(v0.gen()).toEqual({
            micks: {
                porsche: { doors: 4, color: 'silver' },
                ferrari: { doors: 4, color: 'red' },
                telsa: { doors: 4, color: 'green' }
            },
            def: { car: { doors: 4, color: 'green' }, garage: {} }
        });
    });
});

}).call(this)}).call(this,"/dist/test")
},{"../aontu":1}],20:[function(require,module,exports){
(function (global,__dirname){(function (){
"use strict";
/* Copyright (c) 2020-2023 Richard Rodger and other contributors, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
const lang_1 = require("../lib/lang");
const unify_1 = require("../lib/unify");
const val_1 = require("../lib/val");
const MapVal_1 = require("../lib/val/MapVal");
let lang = new lang_1.Lang();
let P = lang.parse.bind(lang);
describe('lang', function () {
    it('happy', () => {
        expect(P('1').canon).toEqual('1');
        expect(P('a:1').canon).toEqual('{"a":1}');
        expect(P('{a:{b:x}}').canon).toEqual('{"a":{"b":"x"}}');
        expect(P('a:11|22,b:33', { xlog: -1 }).canon).toEqual('{"a":11|22,"b":33}');
        expect(P('a:11|22|33,b:44', { xlog: -1 }).canon).toEqual('{"a":11|22|33,"b":44}');
        expect(P('a:{b:11}|{c:22},b:33', { xlog: -1 }).canon)
            .toEqual('{"a":{"b":11}|{"c":22},"b":33}');
        //console.dir(P('a:{b:11}|{c:22},b:33'), { depth: null })
        expect(P('a:11&22,b:33', { xlog: -1 }).canon).toEqual('{"a":11&22,"b":33}');
        expect(P('a:11&22&33,b:44', { xlog: -1 }).canon).toEqual('{"a":11&22&33,"b":44}');
        expect(P('a:{b:11}&{c:22},b:33', { xlog: -1 }).canon)
            .toEqual('{"a":{"b":11}&{"c":22},"b":33}');
        //console.dir(P('a:{b:11}&{c:22},b:33'), { depth: null })
        expect(P('a:11&22|33,b:44', { xlog: -1 }).canon).toEqual('{"a":11&22|33,"b":44}');
        // console.dir(P('a:11&22|33,b:44', { xlog: -1 }), { depth: null })
        expect(P('a:11|22&33,b:44', { xlog: -1 }).canon).toEqual('{"a":11|22&33,"b":44}');
        // console.dir(P('a:11|22&33,b:44', { xlog: -1 }), { depth: null })
    });
    it('merge', () => {
        let ctx = makeCtx();
        let v0 = P('a:{x:1},a:{y:2}');
        expect(v0.canon).toEqual('{"a":{"x":1}&{"y":2}}');
        let u0 = v0.unify(val_1.TOP, ctx);
        expect(u0.canon).toEqual('{"a":{"x":1,"y":2}}');
        expect(u0.gen()).toEqual({ a: { x: 1, y: 2 } });
        let v1 = P('a:b:{x:1},a:b:{y:2}');
        expect(v1.canon).toEqual('{"a":{"b":{"x":1}}&{"b":{"y":2}}}');
        let u1 = v1.unify(val_1.TOP, ctx);
        expect(u1.canon).toEqual('{"a":{"b":{"x":1,"y":2}}}');
        expect(u1.gen()).toEqual({ a: { b: { x: 1, y: 2 } } });
        let v2 = P('a:b:c:{x:1},a:b:c:{y:2}');
        expect(v2.canon).toEqual('{"a":{"b":{"c":{"x":1}}}&{"b":{"c":{"y":2}}}}');
        let u2 = v2.unify(val_1.TOP, ctx);
        expect(u2.canon).toEqual('{"a":{"b":{"c":{"x":1,"y":2}}}}');
        expect(u2.gen()).toEqual({ a: { b: { c: { x: 1, y: 2 } } } });
        let v0m = P('a:{x:1},a:{y:2},a:{z:3}');
        expect(v0m.canon).toEqual('{"a":{"x":1}&{"y":2}&{"z":3}}');
        let u0m = v0m.unify(val_1.TOP, ctx);
        expect(u0m.canon).toEqual('{"a":{"x":1,"y":2,"z":3}}');
        expect(u0m.gen()).toEqual({ a: { x: 1, y: 2, z: 3 } });
        let v1m = P('a:b:{x:1},a:b:{y:2},a:b:{z:3}');
        expect(v1m.canon).toEqual('{"a":{"b":{"x":1}}&{"b":{"y":2}}&{"b":{"z":3}}}');
        let u1m = v1m.unify(val_1.TOP, ctx);
        expect(u1m.canon).toEqual('{"a":{"b":{"x":1,"y":2,"z":3}}}');
        expect(u1m.gen()).toEqual({ a: { b: { x: 1, y: 2, z: 3 } } });
        let v2m = P('a:b:c:{x:1},a:b:c:{y:2},a:b:c:{z:3}');
        expect(v2m.canon).toEqual('{"a":' +
            '{"b":{"c":{"x":1}}}&' +
            '{"b":{"c":{"y":2}}}&' +
            '{"b":{"c":{"z":3}}}}');
        let u2m = v2m.unify(val_1.TOP, ctx);
        expect(u2m.canon).toEqual('{"a":{"b":{"c":{"x":1,"y":2,"z":3}}}}');
        expect(u2m.gen()).toEqual({ a: { b: { c: { x: 1, y: 2, z: 3 } } } });
    });
    it('ref', () => {
        // console.dir(lang.jsonic.internal().config)
        let v0 = P('a:.x');
        // console.log(v0)
        expect(v0.peg.a.peg).toEqual(['x']);
        let v1 = P('a:.x.y', { xlog: -1 });
        // console.log(v1)
        expect(v1.peg.a.peg).toEqual(['x', 'y']);
    });
    it('file', () => {
        if (undefined !== global.window) {
            return;
        }
        global.console = require('console');
        let g0 = new lang_1.Lang({
        // resolver: makeFileResolver((spec: any) => {
        //   return 'string' === typeof spec ? spec : spec?.peg
        // })
        });
        let t00x = g0.parse('x:@"' + __dirname + '/t00.jsonic"');
        expect(t00x.canon).toEqual('{"x":{"a":1}}');
        let t00xA = g0.parse('A:11,x:@"' + __dirname + '/t00.jsonic"');
        expect(t00xA.canon).toEqual('{"A":11,"x":{"a":1}}');
        let t00xB = g0.parse('x:@"' + __dirname + '/t00.jsonic",B:22');
        expect(t00xB.canon).toEqual('{"x":{"a":1},"B":22}');
        let t00xAB = g0.parse('A:11,x:@"' + __dirname + '/t00.jsonic",B:22');
        expect(t00xAB.canon).toEqual('{"A":11,"x":{"a":1},"B":22}');
        let t00xAs = g0.parse('A:11 x:@"' + __dirname + '/t00.jsonic"');
        expect(t00xAs.canon).toEqual('{"A":11,"x":{"a":1}}');
        let t00xBs = g0.parse('x:@"' + __dirname + '/t00.jsonic" B:22');
        expect(t00xBs.canon).toEqual('{"x":{"a":1},"B":22}');
        let t00xABs = g0.parse('A:11 x:@"' + __dirname + '/t00.jsonic" B:22');
        expect(t00xABs.canon).toEqual('{"A":11,"x":{"a":1},"B":22}');
        let t00v = g0.parse('@"' + __dirname + '/t00.jsonic"');
        expect(t00v.canon).toEqual('{}&{"a":1}');
        let t00 = new unify_1.Unify(t00v);
        expect(t00.res.canon).toEqual('{"a":1}');
        expect(t00.res.gen()).toEqual({ a: 1 });
        let t00vX = g0.parse(' X:11 @"' + __dirname + '/t00.jsonic"');
        expect(t00vX.canon).toEqual('{"X":11}&{"a":1}');
        let t00X = new unify_1.Unify(t00vX);
        expect(t00X.res.canon).toEqual('{"X":11,"a":1}');
        expect(t00X.res.gen()).toEqual({ X: 11, a: 1 });
        let t00vY = g0.parse('@"' + __dirname + '/t00.jsonic" Y:22 ');
        expect(t00vY.canon).toEqual('{"Y":22}&{"a":1}');
        let t00Y = new unify_1.Unify(t00vY);
        expect(t00Y.res.canon).toEqual('{"Y":22,"a":1}');
        expect(t00Y.res.gen()).toEqual({ Y: 22, a: 1 });
        let t00dv = g0.parse('D:{@"' + __dirname + '/t00.jsonic"}');
        expect(t00dv.canon).toEqual('{"D":{}&{"a":1}}');
        let t00d = new unify_1.Unify(t00dv);
        expect(t00d.res.canon).toEqual('{"D":{"a":1}}');
        expect(t00d.res.gen()).toEqual({ D: { a: 1 } });
        let t01v = g0.parse('@"' + __dirname + '/t01.jsonic"');
        expect(t01v.canon).toEqual('{}&{"a":1,"b":{"d":2},"c":3}');
        // let t02v = g0.parse('@"' + __dirname + '/t02.jsonic"')
        // console.dir(t02v, { depth: null })
        // console.log(t02v.canon)
        // let u02 = new Unify(t02v)
        // console.log(u02.res.canon)
        // console.log(u02.res.gen())
    });
    it('conjunct', () => {
        expect(P('1&number').canon).toEqual('1&number');
        expect(P('number&1').canon).toEqual('number&1');
        // FIX
        // expect(() => P('*1&number')).throws()
        // expect(() => P('number&*1')).throws()
        expect(P('{a:1}&{b:2}').canon).toEqual('{"a":1}&{"b":2}');
        expect(P('{a:{c:1}}&{b:{d:2}}').canon).toEqual('{"a":{"c":1}}&{"b":{"d":2}}');
        // FIX
        // expect(() => P('*1')).throws()
    });
    it('disjunct', () => {
        // console.log(P('1|2|3|4', { log: -1 }).canon)
        // FIX
        // expect(() => P('*1')).throws()
        let v0 = P('1|number');
        expect(v0.canon).toEqual('1|number');
        let v1 = P('*1|number', { xlog: -1 });
        //console.dir(v1, { depth: null })
        expect(v1.canon).toEqual('*1|number');
        let v2 = P('integer|*2', { xlog: -1 });
        //console.dir(v2, { depth: null })
        expect(v2.canon).toEqual('integer|*2');
    });
    it('precedence', () => {
        let v0 = P('a:b:1&2');
        // console.dir(v0, { depth: null })
        expect(v0.canon).toEqual('{"a":{"b":1&2}}');
    });
    it('spreads', () => {
        let ctx = makeCtx();
        let v0 = P('a:{&:{x:1,y:integer},b:{y:1},c:{y:2}}');
        expect(v0.canon).toEqual('{"a":{&:{"x":1,"y":integer},"b":{"y":1},"c":{"y":2}}}');
        let u0 = v0.unify(val_1.TOP, ctx);
        expect(u0.canon)
            .toEqual('{"a":{&:{"x":1,"y":integer},"b":{"y":1,"x":1},"c":{"y":2,"x":1}}}');
        let v1 = P('k:{x:1,y:integer},a:{&:$.k,b:{y:1},c:{y:2}}');
        expect(v1.canon)
            .toEqual('{"k":{"x":1,"y":integer},"a":{&:$.k,"b":{"y":1},"c":{"y":2}}}');
        let c1 = makeCtx({ root: v1 });
        let u1a = v1.unify(val_1.TOP, c1);
        //console.log(u1a.done, u1a.canon)
        expect(u1a.canon).
            toEqual('{"k":{"x":1,"y":integer},"a":{&:$.k,' +
            '"b":{"x":1,"y":1},"c":{"x":1,"y":2}}}');
        let v2 = P('a:{&:number},a:{x:1},a:{y:2}');
        expect(v2.canon).toEqual('{"a":{&:number}&{"x":1}&{"y":2}}');
        let u2 = v2.unify(val_1.TOP, ctx);
        expect(u2.canon).toEqual('{"a":{&:number,"x":1,"y":2}}');
        let v3 = P('a:{&:number,z:3},a:{x:1},a:{y:2}');
        expect(v3.canon).toEqual('{"a":{&:number,"z":3}&{"x":1}&{"y":2}}');
        let u3 = v3.unify(val_1.TOP, ctx);
        expect(u3.canon).toEqual('{"a":{&:number,"z":3,"x":1,"y":2}}');
        let v4 = P('b:{a:{&:number,z:3},a:{x:1},a:{y:2}}');
        expect(v4.canon).toEqual('{"b":{"a":{&:number,"z":3}&{"x":1}&{"y":2}}}');
        let u4 = v4.unify(val_1.TOP, ctx);
        expect(u4.canon).toEqual('{"b":{"a":{&:number,"z":3,"x":1,"y":2}}}');
        // Must commute!
        let v5a = P('{&:{x:1}}&{a:{y:1}}');
        let u5a = v5a.unify(val_1.TOP, ctx);
        expect(u5a.canon).toEqual('{&:{"x":1},"a":{"y":1,"x":1}}');
        let v5b = P('{a:{y:1}}&{&:{x:1}}');
        let u5b = v5b.unify(val_1.TOP, ctx);
        expect(u5b.canon).toEqual('{&:{"x":1},"a":{"y":1,"x":1}}');
        let v6 = P('b:{a:{&:{K:0},z:{Z:3}},a:{x:{X:1}},a:{y:{Y:2}}}');
        expect(v6.canon)
            .toEqual('{"b":{"a":{&:{"K":0},"z":{"Z":3}}&{"x":{"X":1}}&{"y":{"Y":2}}}}');
        let u6 = v6.unify(val_1.TOP, ctx);
        expect(u6.canon)
            .toEqual('{"b":{"a":{&:{"K":0},' +
            '"z":{"Z":3,"K":0},"x":{"X":1,"K":0},"y":{"Y":2,"K":0}}}}');
    });
    it('pair-spreads', () => {
        let s1 = `a:b:c:1 z:2`;
        expect(P(s1).canon).toEqual('{"a":{"b":{"c":1}},"z":2}');
        let s1_1 = `a:&:b:1 z:2`;
        expect(P(s1_1).canon).toEqual('{"a":{&:{"b":1}},"z":2}');
        let s1_2 = `a:&:{b:1} z:2`;
        expect(P(s1_2).canon).toEqual('{"a":{&:{"b":1}},"z":2}');
        let s1_3 = `a:{&:{b:1}} z:2`;
        expect(P(s1_3).canon).toEqual('{"a":{&:{"b":1}},"z":2}');
        let s1_4 = `{a:{&:{b:1}} z:2}`;
        expect(P(s1_4).canon).toEqual('{"a":{&:{"b":1}},"z":2}');
        let s2 = `a:&:b:&:1 z:2`;
        expect(P(s2).canon).toEqual('{"a":{&:{"b":{&:1}}},"z":2}');
        let s2_1 = `a:&:b:{&:1} z:2`;
        expect(P(s2_1).canon).toEqual('{"a":{&:{"b":{&:1}}},"z":2}');
        let s2_2 = `a:&:{b:{&:1}} z:2`;
        expect(P(s2_2).canon).toEqual('{"a":{&:{"b":{&:1}}},"z":2}');
        let s2_3 = `a:{&:{b:{&:1}}} z:2`;
        expect(P(s2_3).canon).toEqual('{"a":{&:{"b":{&:1}}},"z":2}');
        let s2_4 = `{a:{&:{b:{&:1}}} z:2}`;
        expect(P(s2_4).canon).toEqual('{"a":{&:{"b":{&:1}}},"z":2}');
        let s3 = `a:&:b:&:c:1 z:2`;
        expect(P(s3).canon).toEqual('{"a":{&:{"b":{&:{"c":1}}}},"z":2}');
        let s4 = `a:&:b:&:{c:1} z:2`;
        expect(P(s4).canon).toEqual('{"a":{&:{"b":{&:{"c":1}}}},"z":2}');
        let s5 = `a:&:{b:&:c:1} z:2`;
        expect(P(s5).canon).toEqual('{"a":{&:{"b":{&:{"c":1}}}},"z":2}');
        let s6 = `a:&:{b:&:{c:1}} z:2`;
        expect(P(s6).canon).toEqual('{"a":{&:{"b":{&:{"c":1}}}},"z":2}');
    });
    it('source', () => {
        let v0 = P(`
  a: {
  b: {
    c: 1
    d: 2 & 3 
  }
  }
  `);
        // REMOVE
        // console.dir(v0, { depth: null })
    });
});
function makeCtx(opts) {
    return new unify_1.Context(opts || { root: new MapVal_1.MapVal({ peg: {} }) });
}

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},"/dist/test")
},{"../lib/lang":3,"../lib/unify":8,"../lib/val":9,"../lib/val/MapVal":13,"console":45}],21:[function(require,module,exports){
"use strict";
/* Copyright (c) 2020-2023 Richard Rodger and other contributors, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
const lang_1 = require("../lib/lang");
const unify_1 = require("../lib/unify");
const MapVal_1 = require("../lib/val/MapVal");
const op_1 = require("../lib/op/op");
let lang = new lang_1.Lang();
let PL = lang.parse.bind(lang);
let P = (x, ctx) => PL(x, ctx);
let PA = (x, ctx) => x.map(s => PL(s, ctx));
describe('op', () => {
    it('happy', () => {
        expect(op_1.unite.name).toEqual('unite');
        expect(op_1.disjunct.name).toEqual('disjunct');
    });
    it('unite-scalar-val', () => {
        let U = makeUnite();
        expect(U('nil nil')).toEqual('nil');
        // EXPANSION: expect(unite(ctx, P('nil'), P('nil')).canon).toEqual('nil')
        expect(U('undef nil')).toEqual('nil');
        // EXPANSION: expect(unite(ctx, undefined, P('nil')).canon).toEqual('nil')
        expect(U('nil')).toEqual('nil');
        // EXPANSION: expect(unite(ctx, P('nil')).canon).toEqual('nil')
        expect(U('')).toEqual('nil');
        // EXPANSION: expect(unite(ctx).canon).toEqual('nil')
        expect(U('top          ')).toEqual('top');
        expect(U('undef  top   ')).toEqual('top');
        expect(U('top    top   ')).toEqual('top');
        expect(U('top    1     ')).toEqual('1');
        expect(U('1      top   ')).toEqual('1');
        expect(U('top    nil   ')).toEqual('nil');
        expect(U('nil    top   ')).toEqual('nil');
        expect(U('1            ')).toEqual('1');
        expect(U('undef  1     ')).toEqual('1');
        expect(U('1      1     ')).toEqual('1');
        expect(U('1      2     ')).toEqual('nil');
        expect(U('2      1     ')).toEqual('nil');
        expect(U('1      "a"   ')).toEqual('nil');
        expect(U('"a"    1     ')).toEqual('nil');
        expect(U('1      nil   ')).toEqual('nil');
        expect(U('nil    1     ')).toEqual('nil');
        expect(U('true         ')).toEqual('true');
        expect(U('undef  true  ')).toEqual('true');
        expect(U('true   true  ')).toEqual('true');
        expect(U('true   2     ')).toEqual('nil');
        expect(U('2      true  ')).toEqual('nil');
        expect(U('true  "a"    ')).toEqual('nil');
        expect(U('"a"    true  ')).toEqual('nil');
        expect(U('true   false ')).toEqual('nil');
        expect(U('false  true  ')).toEqual('nil');
        expect(U('true   nil   ')).toEqual('nil');
        expect(U('nil    true  ')).toEqual('nil');
        expect(U('false        ')).toEqual('false');
        expect(U('undef  false ')).toEqual('false');
        expect(U('false  false ')).toEqual('false');
        expect(U('false  2     ')).toEqual('nil');
        expect(U('2      false ')).toEqual('nil');
        expect(U('false  "a"   ')).toEqual('nil');
        expect(U('"a"    false ')).toEqual('nil');
        expect(U('false  nil   ')).toEqual('nil');
        expect(U('nil    false ')).toEqual('nil');
        expect(U('"a"          ')).toEqual('"a"');
        expect(U('undef  "a"   ')).toEqual('"a"');
        expect(U('"a"    "a"   ')).toEqual('"a"');
        expect(U('"a"    "b"   ')).toEqual('nil');
        expect(U('"b"    "a"   ')).toEqual('nil');
        expect(U('"a"    nil   ')).toEqual('nil');
        expect(U('nil    "a"   ')).toEqual('nil');
    });
    it('unite-scalar-type', () => {
        let U = makeUnite();
        expect(U('number')).toEqual('number');
        expect(U('number  number')).toEqual('number');
        expect(U('number  top')).toEqual('number');
        expect(U('top     number')).toEqual('number');
        expect(U('number  nil')).toEqual('nil');
        expect(U('nil     number')).toEqual('nil');
        expect(U('number  integer')).toEqual('integer');
        expect(U('integer number')).toEqual('integer');
        expect(U('number  string')).toEqual('nil');
        expect(U('string  number')).toEqual('nil');
        expect(U('number  boolean')).toEqual('nil');
        expect(U('boolean number')).toEqual('nil');
        expect(U('number  1')).toEqual('1');
        expect(U('1       number')).toEqual('1');
        expect(U('number  1.1')).toEqual('1.1');
        expect(U('1.1     number')).toEqual('1.1');
        expect(U('number  "a"')).toEqual('nil');
        expect(U('"a"     number')).toEqual('nil');
        expect(U('number  true')).toEqual('nil');
        expect(U('true    number')).toEqual('nil');
        expect(U('number  false')).toEqual('nil');
        expect(U('false   number')).toEqual('nil');
        expect(U('integer')).toEqual('integer');
        expect(U('integer  integer')).toEqual('integer');
        expect(U('integer  top')).toEqual('integer');
        expect(U('top      integer')).toEqual('integer');
        expect(U('integer  nil')).toEqual('nil');
        expect(U('nil      integer')).toEqual('nil');
        expect(U('integer  string')).toEqual('nil');
        expect(U('string   integer')).toEqual('nil');
        expect(U('integer  boolean')).toEqual('nil');
        expect(U('boolean  integer')).toEqual('nil');
        expect(U('integer  1')).toEqual('1');
        expect(U('1        integer')).toEqual('1');
        expect(U('integer  "a"')).toEqual('nil');
        expect(U('"a"      integer')).toEqual('nil');
        expect(U('integer  true')).toEqual('nil');
        expect(U('true     integer')).toEqual('nil');
        expect(U('integer  false')).toEqual('nil');
        expect(U('false    integer')).toEqual('nil');
        expect(U('string')).toEqual('string');
        expect(U('string   string')).toEqual('string');
        expect(U('string   top')).toEqual('string');
        expect(U('top      string')).toEqual('string');
        expect(U('string   nil')).toEqual('nil');
        expect(U('nil      string')).toEqual('nil');
        expect(U('string   boolean')).toEqual('nil');
        expect(U('boolean  string')).toEqual('nil');
        expect(U('string   1')).toEqual('nil');
        expect(U('1        string')).toEqual('nil');
        expect(U('string   "a"')).toEqual('"a"');
        expect(U('"a"      string')).toEqual('"a"');
        expect(U('string   true')).toEqual('nil');
        expect(U('true     string')).toEqual('nil');
        expect(U('string   false')).toEqual('nil');
        expect(U('false    string')).toEqual('nil');
        expect(U('boolean')).toEqual('boolean');
        expect(U('boolean  boolean')).toEqual('boolean');
        expect(U('boolean  top')).toEqual('boolean');
        expect(U('top      boolean')).toEqual('boolean');
        expect(U('boolean  nil')).toEqual('nil');
        expect(U('nil      boolean')).toEqual('nil');
        expect(U('boolean  1')).toEqual('nil');
        expect(U('1        boolean')).toEqual('nil');
        expect(U('boolean  "a"')).toEqual('nil');
        expect(U('"a"      boolean')).toEqual('nil');
        expect(U('boolean  true')).toEqual('true');
        expect(U('true     boolean')).toEqual('true');
        expect(U('boolean  false')).toEqual('false');
        expect(U('false    boolean')).toEqual('false');
    });
    it('unite-map-scalar', () => {
        let U = makeUnite();
        expect(U('{a:1}')).toEqual('{"a":1}');
        expect(U('undef  {a:1}')).toEqual('{"a":1}');
        expect(U('{a:1}  {a:1}')).toEqual('{"a":1}');
        expect(U('{a:1}  top')).toEqual('{"a":1}');
        expect(U('top    {a:1}')).toEqual('{"a":1}');
        expect(U('{a:1}    nil')).toEqual('nil');
        expect(U('nil      {a:1}')).toEqual('nil');
        expect(U('{a:1}    1')).toEqual('nil');
        expect(U('1        {a:1}')).toEqual('nil');
        expect(U('{a:1}    "b"')).toEqual('nil');
        expect(U('"b"      {a:1}')).toEqual('nil');
        expect(U('{a:1}    true')).toEqual('nil');
        expect(U('true     {a:1}')).toEqual('nil');
        expect(U('{a:1}    false')).toEqual('nil');
        expect(U('false    {a:1}')).toEqual('nil');
        expect(U('{a:1}    number')).toEqual('nil');
        expect(U('number   {a:1}')).toEqual('nil');
        expect(U('{a:1}    integer')).toEqual('nil');
        expect(U('integer  {a:1}')).toEqual('nil');
        expect(U('{a:1}    string')).toEqual('nil');
        expect(U('string   {a:1}')).toEqual('nil');
        expect(U('{a:1}    boolean')).toEqual('nil');
        expect(U('boolean  {a:1}')).toEqual('nil');
        expect(U('{a:top}    {a:top}')).toEqual('{"a":top}');
        expect(U('{a:nil}    {a:nil}')).toEqual('{"a":nil}');
        expect(U('{a:top}    {a:nil}')).toEqual('{"a":nil}');
        expect(U('{a:nil}    {a:top}')).toEqual('{"a":nil}');
        expect(U('{a:1}      {a:nil}')).toEqual('{"a":nil}');
        expect(U('{a:nil}    {a:1}')).toEqual('{"a":nil}');
        expect(U('{a:1}      {a:top}')).toEqual('{"a":1}');
        expect(U('{a:top}    {a:1}')).toEqual('{"a":1}');
        expect(U('{a:1}      {a:2}')).toEqual('{"a":nil}');
        expect(U('{a:2}      {a:1}')).toEqual('{"a":nil}');
        expect(U('{a:1}      {a:true}')).toEqual('{"a":nil}');
        expect(U('{a:true}   {a:1}')).toEqual('{"a":nil}');
        expect(U('{a:1}      {a:false}')).toEqual('{"a":nil}');
        expect(U('{a:false}  {a:1}')).toEqual('{"a":nil}');
        expect(U('{a:number}   {a:1}')).toEqual('{"a":1}');
        expect(U('{a:integer}  {a:1}')).toEqual('{"a":1}');
        expect(U('{a:integer}  {a:1.1}')).toEqual('{"a":nil}');
        expect(U('{a:string}   {a:1}')).toEqual('{"a":nil}');
        expect(U('{a:boolean}  {a:1}')).toEqual('{"a":nil}');
        expect(U('{a:1}        {a:number}')).toEqual('{"a":1}');
        expect(U('{a:1}        {a:integer}')).toEqual('{"a":1}');
        expect(U('{a:1.1}      {a:integer}')).toEqual('{"a":nil}');
        expect(U('{a:1}        {a:string}')).toEqual('{"a":nil}');
        expect(U('{a:1}        {a:boolean}')).toEqual('{"a":nil}');
        expect(U('{a:number}   {a:"x"}')).toEqual('{"a":nil}');
        expect(U('{a:integer}  {a:"x"}')).toEqual('{"a":nil}');
        expect(U('{a:string}   {a:"x"}')).toEqual('{"a":"x"}');
        expect(U('{a:boolean}  {a:"x"}')).toEqual('{"a":nil}');
        expect(U('{a:"x"}      {a:number}')).toEqual('{"a":nil}');
        expect(U('{a:"x"}      {a:integer}')).toEqual('{"a":nil}');
        expect(U('{a:"x"}      {a:string}')).toEqual('{"a":"x"}');
        expect(U('{a:"x"}      {a:boolean}')).toEqual('{"a":nil}');
        expect(U('{a:true}     {a:number}')).toEqual('{"a":nil}');
        expect(U('{a:true}     {a:integer}')).toEqual('{"a":nil}');
        expect(U('{a:true}     {a:string}')).toEqual('{"a":nil}');
        expect(U('{a:true}     {a:boolean}')).toEqual('{"a":true}');
        expect(U('{a:number}   {a:true}')).toEqual('{"a":nil}');
        expect(U('{a:integer}  {a:true}')).toEqual('{"a":nil}');
        expect(U('{a:string}   {a:true}')).toEqual('{"a":nil}');
        expect(U('{a:boolean}  {a:true}')).toEqual('{"a":true}');
        expect(U('{a:number}   {a:false}')).toEqual('{"a":nil}');
        expect(U('{a:integer}  {a:false}')).toEqual('{"a":nil}');
        expect(U('{a:string}   {a:false}')).toEqual('{"a":nil}');
        expect(U('{a:boolean}  {a:false}')).toEqual('{"a":false}');
        expect(U('{a:false}    {a:number}')).toEqual('{"a":nil}');
        expect(U('{a:false}    {a:integer}')).toEqual('{"a":nil}');
        expect(U('{a:false}    {a:string}')).toEqual('{"a":nil}');
        expect(U('{a:false}    {a:boolean}')).toEqual('{"a":false}');
        expect(U('{a:1}        {b:2}')).toEqual('{"a":1,"b":2}');
        expect(U('{b:2}        {a:1}')).toEqual('{"b":2,"a":1}');
    });
    it('unite-conjunct', () => {
        let U = makeUnite();
        //expect(U('1&1')).toEqual('1')
        expect(U('1&number')).toEqual('1');
    });
});
function makeCtx(r) {
    return new unify_1.Context({ root: r || new MapVal_1.MapVal({ peg: {} }) });
}
function makeUnite(r) {
    let ctx = makeCtx(r);
    return (s) => {
        let terms = s.trim().split(/\s+/).map(x => 'undef' === x ? undefined : x);
        return (0, op_1.unite)(ctx, ...PA(terms)).canon;
    };
}

},{"../lib/lang":3,"../lib/op/op":5,"../lib/unify":8,"../lib/val/MapVal":13}],22:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lang_1 = require("../lib/lang");
let lang = new lang_1.Lang();
let P = lang.parse.bind(lang);
describe('unify', function () {
    it('find', () => {
        // let ref = (s: string) => (P(s) as RefVal)
        // let m0 = P('{a:1,b:{c:2},d:{e:{f:3}}')
        // let c0 = new Context({
        //   root: m0
        // })
        // expect(c0.find(ref('.a'))?.canon).toEqual('1')
        // expect(c0.find(ref('.b.c'))?.canon).toEqual('2')
        // expect(c0.find(ref('.d.e.f'))?.canon).toEqual('3')
        // expect(c0.find(ref('.b'))?.canon).toEqual('{"c":2}')
        // expect(c0.find(ref('.x'))).toEqual(undefined)
    });
    /*
    it('basic', () => {
      let u0 = new Unify('1')
      expect(u0.res.canon).toEqual('1')
  
      let uc = (s: string) => new Unify(s).res.canon
  
      expect(uc('1')).toEqual('1')
      expect(uc('1&1')).toEqual('1')
      expect(uc('number&1')).toEqual('1')
      expect(uc('top&1')).toEqual('1')
      //expect(uc('nil&1')).toEqual('nil')
  
      expect(uc('{a:1}')).toEqual('{"a":1}')
      expect(uc('{a:1}&{b:2}')).toEqual('{"a":1,"b":2}')
      expect(uc('{a:1}&{a:number,b:2}')).toEqual('{"a":1,"b":2}')
    })
  
  
      it('merge-is-conjunct', () => {
        // let ur = (s: string) => new Unify(s).res
        let uc = (s: string) => new Unify(s).res.canon
    
        let u0 = new Unify('a:1,a:integer')
        expect(u0.root.canon).toEqual('{"a":1}')
    
        expect(uc('a:number,a:1')).toEqual('{"a":1}')
        expect(uc('a:{b:1},a:{c:2}')).toEqual('{"a":{"b":1,"c":2}}')
        expect(uc('a:{b:1,c:number,d:boolean},a:{c:2},a:{d:true}'))
          .toEqual('{"a":{"b":1,"c":2,"d":true}}')
    
        expect(uc('a:number,a:true')).toMatch(/^\{"a":nil/)
      })
    
    
      it('pref-in-conjunct', () => {
        let uc = (s: string) => new Unify(s).res.canon
    
        expect(uc('a:{z:*3|number},d:{&:.a,b:{},c:{z:4}}'))
          .toEqual('{"a":{"z":*3|number},' +
            '"d":{&:{"z":*3|number},"b":{"z":*3|number},"c":{"z":4}}}')
    
        expect(uc('a:{z:*3|number},d:{&:.a,b:{z:"bad"},c:{z:4}}'))
          .toEqual('{"a":{"z":*3|number},' +
            '"d":{&:{"z":*3|number},"b":{"z":nil},"c":{"z":4}}}')
    
        expect(new Unify('a:{z:*3|number},d:{&:.a,b:{},c:{z:4}}').res.gen())
          .toEqual({ a: { z: 3 }, d: { b: { z: 3 }, c: { z: 4 } } })
    
    
        return;
    
    
        // conjunct prefs only resolve on generate, not unify
        expect(uc('*1|number')).toEqual('*1|number')
        expect(uc('a:*1|number')).toEqual('{"a":*1|number}')
        expect(uc('{a:*1|number}&{a:2}')).toEqual('{"a":2}')
        expect(uc('q:{a:*1|number},w:.q&{a:2}'))
          .toEqual('{"q":{"a":*1|number},"w":{"a":2}}')
    
        expect(uc('b:{y:1}&{x:1,y:integer,z:*3|number},c:{y:true,z:4}&{x:1,y:integer,z:*3|number}'))
          .toEqual('{"b":{"y":1,"x":1,"z":*3|number},"c":{"y":nil,"z":4,"x":1}}')
    
        expect(uc('a:{x:1,y:integer,z:*3|number},b:{y:1}&/a,c:{y:true,z:4}&/a'))
          .toEqual('{"a":{"x":1,"y":integer,"z":*3|number},"b":{"y":1,"x":1,"z":*3|number},"c":{"y":nil,"z":4,"x":1}}')
    
    
        expect(uc('a:{x:1,y:integer,z:*3|number},d:{b:{y:1}&/a,c:{y:true,z:4}&/a}'))
          .toEqual('{"a":{"x":1,"y":integer,"z":*3|number},"d":{"b":{"y":1,"x":1,"z":*3|number},"c":{"y":nil,"z":4,"x":1}}}')
    
        expect(uc('a:{x:1,y:integer,z:*3|number},d:{&:.a,b:{y:1},c:{y:true,z:4}}'))
          .toEqual('{"a":{"x":1,"y":integer,"z":*3|number},"d":{"b":{"y":1,"x":1,"z":*3|number},"c":{"y":nil,"z":4,"x":1}}}')
    
    
      })
    
    
    
      it('ref', () => {
        let uc = (s: string) => {
          let u = new Unify(s)
          return { c: u.res.canon, d: u.dc }
        }
    
        expect(uc('a:1,b:.a')).toEqual({ c: '{"a":1,"b":1}', d: 1 })
        expect(uc('a:.b,b:1')).toEqual({ c: '{"a":1,"b":1}', d: 1 })
    
        expect(uc('a:1,b:.a,c:.b')).toEqual({ c: '{"a":1,"b":1,"c":1}', d: 1 })
    
        expect(uc('a:{b:1}')).toEqual({ c: '{"a":{"b":1}}', d: 1 })
        expect(uc('{a:{b:1}} & c:2')).toEqual({ c: '{"a":{"b":1},"c":2}', d: 1 })
    
        expect(uc('a:{b:1}, c:.a.b')).toEqual({ c: '{"a":{"b":1},"c":1}', d: 1 })
        expect(uc('c:.a.b, a:{b:1},')).toEqual({ c: '{"c":1,"a":{"b":1}}', d: 1 })
    
        expect(uc('c:.a.b, a:{b:.d}, d:1'))
          .toEqual({ c: '{"c":1,"a":{"b":1},"d":1}', d: 2 })
    
        expect(uc('a:{b:1},x:.a&{y:2}'))
          .toEqual({ c: '{"a":{"b":1},"x":{"b":1,"y":2}}', d: 1 })
    
        expect(uc('a:{b:1,y:number},x:{z2:.a&{y:2},z3:.a&{y:3}}'))
          .toEqual({
            c: '{"a":{"b":1,"y":number},' +
              '"x":{"z2":{"b":1,"y":2},"z3":{"b":1,"y":3}}}', d: 1
          })
    
      })
    
    
      it('spreads', () => {
        let uc = (s: string) => new Unify(s).res.canon
    
        expect(uc('a:{&:{x:1,y:integer},b:{y:1},c:{y:2}}'))
          .toEqual('{"a":{&:{"x":1,"y":integer},"b":{"y":1,"x":1},"c":{"y":2,"x":1}}}')
    
        expect(uc('a:{&:{x:1,y:integer},b:{y:1},c:{y:true}}'))
          .toEqual('{"a":{&:{"x":1,"y":integer},"b":{"y":1,"x":1},"c":{"y":nil,"x":1}}}')
    
        expect(uc('a:{&:{x:1,y:integer,z:*3|number},b:{y:1},c:{y:true}}'))
          .toEqual('{"a":{&:{"x":1,"y":integer,"z":*3|number},"b":{"y":1,"x":1,"z":*3|number},"c":{"y":nil,"x":1,"z":*3|number}}}')
    
        expect(uc('q:{x:1,y:integer},a:{&:.q,b:{y:1},c:{y:2}}'))
          .toEqual('{"q":{"x":1,"y":integer},"a":{&:{"x":1,"y":integer},"b":{"y":1,"x":1},"c":{"y":2,"x":1}}}')
    
        expect(uc('q:{x:1,y:integer},a:{&:.q,b:{y:1},c:{y:true}}'))
          .toEqual('{"q":{"x":1,"y":integer},"a":{&:{"x":1,"y":integer},"b":{"y":1,"x":1},"c":{"y":nil,"x":1}}}')
    
        expect(uc('q:{x:1,y:integer,z:*3|number},a:{&:.q,b:{y:1,z:4},c:{y:2}}'))
          .toEqual('{"q":{"x":1,"y":integer,"z":*3|number},"a":{&:{"x":1,"y":integer,"z":*3|number},"b":{"y":1,"z":4,"x":1},"c":{"y":2,"x":1,"z":*3|number}}}')
    
    
        expect(uc('p:{x:1},q:{y:2},u:.p&.q,v:{&:.u,a:{z:33},b:{z:44}}'))
          .toEqual('{"p":{"x":1},"q":{"y":2},"u":{"x":1,"y":2},"v":{&:{"x":1,"y":2},"a":{"z":33,"x":1,"y":2},"b":{"z":44,"x":1,"y":2}}}')
    
        expect(uc('p:x:1,q:y:2,u:.p&.q,v:{&:.u,a:z:33,b:z:44}'))
          .toEqual('{"p":{"x":1},"q":{"y":2},"u":{"x":1,"y":2},"v":{&:{"x":1,"y":2},"a":{"z":33,"x":1,"y":2},"b":{"z":44,"x":1,"y":2}}}')
    
        expect(uc('p:x:1,q:y:2,v:{&:.p,&:.q,a:z:33,b:z:44}'))
          .toEqual('{"p":{"x":1},"q":{"y":2},"v":{&:{"x":1,"y":2},"a":{"z":33,"x":1,"y":2},"b":{"z":44,"x":1,"y":2}}}')
    
      })
    
    
    
      /*
      it('error', () => {
        let uc = (s: string) => new Unify(s).res.canon
    
        expect(uc('1&string')).startsWith('nil')
        expect(uc('{a:1}&{a:string}')).startsWith('{"a":nil')
    
    
        let e0 = new Unify('a:b:1&2')
        //console.log(e0.res.canon)
        //console.log(e0.err)
        expect(e0.err[0].path.join('/')).toEqual('a/b')
    
        let e1 = new Unify('a:b:1&2,c:d:e:true&3')
        //console.log(e1.res.canon)
        //console.log(e1.err)
        expect(e1.err[0].path.join('/')).toEqual('a/b')
        expect(e1.err[1].path.join('/')).toEqual('c/d/e')
    
    
        let e2 = new Unify(`
    a: {
      b: {
        c: 1
        d: 2 & 3
      }
    }
    `)
    
        //console.dir(e2.res, { depth: null })
        //console.dir(e2.err, { depth: null })
    
      })
      */
});

},{"../lib/lang":3}],23:[function(require,module,exports){
"use strict";
/* Copyright (c) 2020-2023 Richard Rodger and other contributors, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
const lang_1 = require("../lib/lang");
const unify_1 = require("../lib/unify");
const val_1 = require("../lib/val");
const MapVal_1 = require("../lib/val/MapVal");
const lang = new lang_1.Lang();
const PL = lang.parse.bind(lang);
const P = (x, ctx) => PL(x, ctx);
const D = (x) => console.dir(x, { depth: null });
const UC = (s, r) => (r = P(s)).unify(val_1.TOP, makeCtx(r)).canon;
const G = (x, ctx) => new unify_1.Unify(x, lang).res.gen(ctx);
const V = (x) => console.dir(x, { depth: null });
describe('val-conjunct', function () {
    it('norm', () => {
        // let c0 = P('1&2&3')
        // let nc0 = norm(c0.peg)
        // expect(nc0.map(e => e.peg)).equal([1, 2, 3])
        // // Only norm to one level!
        // let c1 = P('1&2&3&4')
        // let nc1 = norm(c1.peg)
        // expect(nc1.map(e => e.peg)).equal([nc1[0].peg, 3, 4])
    });
    it('basic', () => {
        let g0 = G('1&number');
        // console.log(g0)
        expect(g0).toEqual(1);
        let g1 = G('{a:1}&{b:2}&{c:3}');
        // console.log(g0)
        expect(g1).toEqual({ a: 1, b: 2, c: 3 });
    });
    it('ref', () => {
        let g0 = G('a:1,b:number&$.a');
        expect(g0).toEqual({ a: 1, b: 1 });
        let g1 = G('x:a:1,x:b:$.x.a');
        expect(g1).toEqual({ x: { a: 1, b: 1 } });
        let g2 = G('x:a:1,x:b:number&$.x.a');
        expect(g2).toEqual({ x: { a: 1, b: 1 } });
        expect(UC('a:*1|number,b:*2|number,c:$.a&$.b'))
            .toEqual('{"a":*1|number,"b":*2|number,"c":*2|*1|number}');
        let g3 = G('{b:$.a&$.a}&{a:1}');
        expect(g3).toEqual({ a: 1, b: 1 });
    });
    it('disjunct', () => {
        let u0 = UC('a:{x:1}|{y:2},a:{z:3}');
        expect(u0).toEqual('{"a":{"x":1,"z":3}|{"y":2,"z":3}}');
        let u1 = UC('a:{x:1}|{y:2},a:{z:3}|{q:4}');
        expect(u1)
            .toEqual('{"a":{"x":1,"z":3}|{"y":2,"z":3}|{"x":1,"q":4}|{"y":2,"q":4}}');
        let u2 = UC('a:*1|number,a:*2|number');
        expect(u2).toEqual('{"a":*2|*1|number}');
        let u3 = UC('*1|number & *2|number');
        expect(u3).toEqual('*2|*1|number');
    });
    it('map', () => {
        let m0 = UC('{a:1}&{b:2}');
        expect(m0).toEqual('{"a":1,"b":2}');
        let m1 = UC('x:{a:$.y}&{b:2},y:1');
        expect(m1).toEqual('{"x":{"a":1,"b":2},"y":1}');
        let s2 = 'x:{a:$.x.b}&{b:2}';
        expect(UC(s2)).toEqual('{"x":{"a":$.x.b,"b":2}}');
        expect(G(s2)).toEqual({ "x": { "a": 2, "b": 2 } });
        let s3 = 'y:x:{a:$.y.x.b}&{b:2}';
        expect(UC(s3)).toEqual('{"y":{"x":{"a":$.y.x.b,"b":2}}}');
        expect(G(s3)).toEqual({ y: { x: { a: 2, b: 2 } } });
    });
    it('conjunct-spread', () => {
        let g0 = G('{&:{x:*1|number},a:{},b:{x:2}}');
        expect(g0).toEqual({ a: { x: 1 }, b: { x: 2 } });
        let g1 = G('&:{x:*1|number},a:{},b:{x:2}');
        expect(g1).toEqual({ a: { x: 1 }, b: { x: 2 } });
        // let p2 = P('a1: &: { x1: 11 } b2: { y2: 22 }')
        // console.dir(p2, { depth: null })
        let g2 = G('a1: &: { x1: 11 } b2: { y2: 22 }');
        expect(g2).toEqual({ a1: {}, b2: { y2: 22 } });
        let g3 = G('a1: &: { c1: { x1: 11 } } b2: { y2: 22 }');
        expect(g3).toEqual({ a1: {}, b2: { y2: 22 } });
        // let p4 = P('a1: &: { c1: &: { x1: 11 } } b2: { y2: 22 }')
        // console.dir(p4, { depth: null })
        let g4 = G('a1: &: { c1: &: { x1: 11 } } b2: { y2: 22 }');
        expect(g4).toEqual({ a1: {}, b2: { y2: 22 } });
        // let p5 = P('a1: &: { c1: &: { d1: &: { x1: 11 } } } b2: { y2: 22 }')
        // console.dir(p5, { depth: null })
        let g5 = G('a1: &: { c1: &: { d1: &: { x1: 11 } } } b2: { y2: 22 }');
        expect(g5).toEqual({ a1: {}, b2: { y2: 22 } });
    });
    it('clone', () => {
        let v0 = P('{x:1}&{y:2}&{z:3}');
        // console.log(v0.canon)
        expect(v0.canon).toEqual('{"x":1}&{"y":2}&{"z":3}');
        let v0c = v0.clone();
        expect(v0c.canon).toEqual('{"x":1}&{"y":2}&{"z":3}');
    });
});
function print(o, t) {
    if (null != t) {
        console.log(t);
    }
    console.dir(o, { depth: null });
}
function makeCtx(r) {
    return new unify_1.Context({ root: r || new MapVal_1.MapVal({ peg: {} }) });
}

},{"../lib/lang":3,"../lib/unify":8,"../lib/val":9,"../lib/val/MapVal":13}],24:[function(require,module,exports){
"use strict";
/* Copyright (c) 2020-2023 Richard Rodger and other contributors, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
const lang_1 = require("../lib/lang");
const unify_1 = require("../lib/unify");
const val_1 = require("../lib/val");
const MapVal_1 = require("../lib/val/MapVal");
const lang = new lang_1.Lang();
const PL = lang.parse.bind(lang);
const P = (x, ctx) => PL(x, ctx);
const D = (x) => console.dir(x, { depth: null });
const UC = (s, r) => (r = P(s)).unify(val_1.TOP, makeCtx(r)).canon;
const G = (x, ctx) => new unify_1.Unify(x, lang).res.gen(ctx);
const V = (x) => console.dir(x, { depth: null });
describe('val-disjunct', function () {
    it('basic', () => {
        let u0 = UC('a:{x:1}|{y:2},a:{z:3}');
        expect(u0).toEqual('{"a":{"x":1,"z":3}|{"y":2,"z":3}}');
        let u1 = UC('a:{x:1}|{y:2},a:{z:3}|{q:4}');
        expect(u1)
            .toEqual('{"a":{"x":1,"z":3}|{"y":2,"z":3}|{"x":1,"q":4}|{"y":2,"q":4}}');
        let u2 = UC('a:*1|number,a:*2|number');
        expect(u2).toEqual('{"a":*2|*1|number}');
        let u3 = UC('*1|number & *2|number');
        expect(u3).toEqual('*2|*1|number');
        let g0 = G('{&:{x:*1|number},a:{},b:{x:2}}');
        expect(g0).toEqual({ a: { x: 1 }, b: { x: 2 } });
        let g1 = G('&:{x:*1|number},a:{},b:{x:2}');
        expect(g1).toEqual({ a: { x: 1 }, b: { x: 2 } });
    });
    it('clone', () => {
        let v0 = P('{x:1}|{y:2}|{z:3}');
        // console.log(v0.canon)
        expect(v0.canon).toEqual('{"x":1}|{"y":2}|{"z":3}');
        let v0c = v0.clone();
        expect(v0c.canon).toEqual('{"x":1}|{"y":2}|{"z":3}');
    });
});
function print(o, t) {
    if (null != t) {
        console.log(t);
    }
    console.dir(o, { depth: null });
}
function makeCtx(r) {
    return new unify_1.Context({ root: r || new MapVal_1.MapVal({ peg: {} }) });
}

},{"../lib/lang":3,"../lib/unify":8,"../lib/val":9,"../lib/val/MapVal":13}],25:[function(require,module,exports){
"use strict";
/* Copyright (c) 2020-2023 Richard Rodger and other contributors, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
const lang_1 = require("../lib/lang");
const unify_1 = require("../lib/unify");
const val_1 = require("../lib/val");
const MapVal_1 = require("../lib/val/MapVal");
const RefVal_1 = require("../lib/val/RefVal");
const lang = new lang_1.Lang();
const PL = lang.parse.bind(lang);
const P = (x, ctx) => PL(x, ctx);
const D = (x) => console.dir(x, { depth: null });
const UC = (s, r) => (r = P(s)).unify(val_1.TOP, makeCtx(r)).canon;
const G = (x, ctx) => new unify_1.Unify(x, lang).res.gen(ctx);
const V = (x) => console.dir(x, { depth: null });
describe('val-ref', function () {
    test('construct', () => {
        let r0 = new RefVal_1.RefVal({ peg: [], absolute: true });
        expect(r0.canon).toEqual('$');
        expect(r0).toMatchObject({
            path: [],
            absolute: true,
            peg: []
        });
        let r1 = new RefVal_1.RefVal({ peg: ['a'], absolute: true });
        expect(r1.canon).toEqual('$.a');
        expect(r1).toMatchObject({
            path: [],
            absolute: true,
            peg: ['a']
        });
        let r2 = new RefVal_1.RefVal({ peg: ['a', 'b'], absolute: true });
        expect(r2.canon).toEqual('$.a.b');
        expect(r2).toMatchObject({
            path: [],
            absolute: true,
            peg: ['a', 'b']
        });
        let r3 = new RefVal_1.RefVal({ peg: ['a'] });
        // console.log(r0)
        expect(r3.canon).toEqual('.a');
        expect(r3).toMatchObject({
            path: [],
            absolute: false,
            peg: ['a']
        });
        let r4 = new RefVal_1.RefVal({ peg: ['a', 'b'] });
        // console.log(r0)
        expect(r4.canon).toEqual('.a.b');
        expect(r4).toMatchObject({
            path: [],
            absolute: false,
            peg: ['a', 'b']
        });
        let r5 = new RefVal_1.RefVal({ peg: ['a', 'b', 'c'] });
        // console.log(r0)
        expect(r5.canon).toEqual('.a.b.c');
        expect(r5).toMatchObject({
            path: [],
            absolute: false,
            peg: ['a', 'b', 'c']
        });
        let r6 = new RefVal_1.RefVal({ peg: ['a', 'b', 'c'], absolute: true });
        // console.log(r0)
        expect(r6.canon).toEqual('$.a.b.c');
        expect(r6).toMatchObject({
            path: [],
            absolute: true,
            peg: ['a', 'b', 'c']
        });
        let r7 = new RefVal_1.RefVal({ peg: [] });
        expect(r7.canon).toEqual('');
        expect(r7).toMatchObject({
            path: [],
            absolute: false,
            peg: []
        });
        let r8 = new RefVal_1.RefVal({
            peg: [
                new RefVal_1.RefVal({ peg: ['a'] }),
                'b'
            ]
        });
        expect(r8.canon).toEqual('.a.b');
        expect(r8).toMatchObject({
            path: [],
            absolute: false,
            peg: ['a', 'b']
        });
        let r9 = new RefVal_1.RefVal({
            peg: [
                'a',
                new RefVal_1.RefVal({ peg: ['b'] }),
            ]
        });
        expect(r9.canon).toEqual('.a.b');
        expect(r9).toMatchObject({
            path: [],
            absolute: false,
            peg: ['a', 'b']
        });
        let r10 = new RefVal_1.RefVal({
            peg: [
                new RefVal_1.RefVal({ peg: ['a'] }),
                new RefVal_1.RefVal({ peg: ['b'] }),
            ]
        });
        expect(r10.canon).toEqual('.a.b');
        expect(r10).toMatchObject({
            path: [],
            absolute: false,
            peg: ['a', 'b']
        });
        let r11 = new RefVal_1.RefVal({
            peg: [
                new RefVal_1.RefVal({ peg: ['a'], absolute: true }),
                'b'
            ]
        });
        expect(r11).toMatchObject({
            canon: '$.a.b',
            path: [],
            absolute: true,
            peg: ['a', 'b']
        });
        let r12 = new RefVal_1.RefVal({
            peg: [
                'a',
                new RefVal_1.RefVal({ peg: ['b'], absolute: true }),
            ]
        });
        expect(r12).toMatchObject({
            canon: '$.a.b',
            path: [],
            absolute: true,
            peg: ['a', 'b']
        });
        let r13 = new RefVal_1.RefVal({
            peg: [
                new RefVal_1.RefVal({ peg: ['a'], absolute: true }),
                new RefVal_1.RefVal({ peg: ['b'], absolute: true }),
            ]
        });
        expect(r13).toMatchObject({
            canon: '$.a.b',
            path: [],
            absolute: true,
            peg: ['a', 'b']
        });
    });
    test('parse', () => {
        expect(P('.a'))
            .toMatchObject({
            canon: '.a', peg: ['a'],
            prefix: true, absolute: false
        });
        // D(P('..a'))
        expect(P('..a'))
            .toMatchObject({
            canon: '..a', peg: ['.', 'a'],
            prefix: true, absolute: false
        });
        expect(P('...a'))
            .toMatchObject({
            canon: '...a', peg: ['.', '.', 'a'],
            prefix: true, absolute: false
        });
        expect(P('....a'))
            .toMatchObject({
            canon: '....a', peg: ['.', '.', '.', 'a'],
            prefix: true, absolute: false
        });
        // D(P('.a.b'))
        expect(P('.a.b'))
            .toMatchObject({
            canon: '.a.b', peg: ['a', 'b'],
            prefix: true, absolute: false
        });
        expect(P('..a.b'))
            .toMatchObject({
            canon: '..a.b', peg: ['.', 'a', 'b'],
            prefix: true, absolute: false
        });
        expect(P('...a.b'))
            .toMatchObject({
            canon: '...a.b', peg: ['.', '.', 'a', 'b'],
            prefix: true, absolute: false
        });
        expect(P('....a.b'))
            .toMatchObject({
            canon: '....a.b', peg: ['.', '.', '.', 'a', 'b'],
            prefix: true, absolute: false
        });
        expect(P('.a..b'))
            .toMatchObject({
            canon: '.a..b', peg: ['a', '.', 'b'],
            prefix: true, absolute: false
        });
        expect(P('.a...b'))
            .toMatchObject({
            canon: '.a...b', peg: ['a', '.', '.', 'b'],
            prefix: true, absolute: false
        });
        expect(P('.a....b'))
            .toMatchObject({
            canon: '.a....b', peg: ['a', '.', '.', '.', 'b'],
            prefix: true, absolute: false
        });
        expect(P('.a.b.c'))
            .toMatchObject({
            canon: '.a.b.c', peg: ['a', 'b', 'c'],
            prefix: true, absolute: false
        });
        // D(P('.a.b..c'))
        expect(P('.a.b..c'))
            .toMatchObject({
            canon: '.a.b..c', peg: ['a', 'b', '.', 'c'],
            prefix: true, absolute: false
        });
        expect(P('.a..b..c'))
            .toMatchObject({
            canon: '.a..b..c', peg: ['a', '.', 'b', '.', 'c'],
            prefix: true, absolute: false
        });
        expect(P('.a..b...c'))
            .toMatchObject({
            canon: '.a..b...c', peg: ['a', '.', 'b', '.', '.', 'c'],
            prefix: true, absolute: false
        });
        expect(P('.a...b...c'))
            .toMatchObject({
            canon: '.a...b...c', peg: ['a', '.', '.', 'b', '.', '.', 'c'],
            prefix: true, absolute: false
        });
        expect(P('.a...b....c'))
            .toMatchObject({
            canon: '.a...b....c', peg: ['a', '.', '.', 'b', '.', '.', '.', 'c'],
            prefix: true, absolute: false
        });
        expect(P('.a....b....c'))
            .toMatchObject({
            canon: '.a....b....c', peg: ['a', '.', '.', '.', 'b', '.', '.', '.', 'c'],
            prefix: true, absolute: false
        });
        expect(P('..a....b....c'))
            .toMatchObject({
            canon: '..a....b....c',
            peg: ['.', 'a', '.', '.', '.', 'b', '.', '.', '.', 'c'],
            prefix: true, absolute: false
        });
        expect(P('...a....b....c'))
            .toMatchObject({
            canon: '...a....b....c',
            peg: ['.', '.', 'a', '.', '.', '.', 'b', '.', '.', '.', 'c'],
            prefix: true, absolute: false
        });
        expect(P('....a....b....c'))
            .toMatchObject({
            canon: '....a....b....c',
            peg: ['.', '.', '.', 'a', '.', '.', '.', 'b', '.', '.', '.', 'c'],
            prefix: true, absolute: false
        });
        expect(P('.a.b..c'))
            .toMatchObject({
            canon: '.a.b..c',
            peg: ['a', 'b', '.', 'c'],
            prefix: true, absolute: false
        });
        expect(P('.a.b...c'))
            .toMatchObject({
            canon: '.a.b...c',
            peg: ['a', 'b', '.', '.', 'c'],
            prefix: true, absolute: false
        });
        expect(P('.a.b....c'))
            .toMatchObject({
            canon: '.a.b....c',
            peg: ['a', 'b', '.', '.', '.', 'c'],
            prefix: true, absolute: false
        });
        expect(P('.a.b.c.d'))
            .toMatchObject({
            canon: '.a.b.c.d',
            peg: ['a', 'b', 'c', 'd'],
            prefix: true, absolute: false
        });
        expect(P('.a.b.c..d'))
            .toMatchObject({
            canon: '.a.b.c..d',
            peg: ['a', 'b', 'c', '.', 'd'],
            prefix: true, absolute: false
        });
        expect(P('.a..b.c..d'))
            .toMatchObject({
            canon: '.a..b.c..d',
            peg: ['a', '.', 'b', 'c', '.', 'd'],
            prefix: true, absolute: false
        });
        expect(P('.a..b..c..d'))
            .toMatchObject({
            canon: '.a..b..c..d',
            peg: ['a', '.', 'b', '.', 'c', '.', 'd'],
            prefix: true, absolute: false
        });
    });
    test('clone', () => {
        let c0 = makeCtx(null, ['x']);
        let r0 = new RefVal_1.RefVal({ peg: ['a'], absolute: true }, c0);
        // console.log(r0)
        expect(r0).toMatchObject({
            canon: '$.a',
            path: ['x'],
            absolute: true,
            peg: ['a']
        });
        let r1 = r0.clone();
        expect(r1).toMatchObject({
            canon: '$.a',
            path: ['x'],
            absolute: true,
            peg: ['a']
        });
        let c1 = makeCtx(null, ['y', 'z']);
        let r2 = r0.clone(null, c1);
        expect(r2).toMatchObject({
            canon: '$.a',
            path: ['y', 'z'],
            absolute: true,
            peg: ['a']
        });
        let c2 = makeCtx(null, ['k']);
        let r3 = r2.clone(null, c2);
        expect(r3).toMatchObject({
            canon: '$.a',
            path: ['k', 'z'],
            absolute: true,
            peg: ['a']
        });
    });
    test('absolute', () => {
        // NOTE: built as VarVal[RefVal]
        let s0 = 'a:$.x,x:1';
        let v0 = P(s0);
        expect(v0.peg.a.peg).toEqual(['x']);
        expect(v0.canon).toEqual('{"a":$.x,"x":1}');
        expect(G(s0)).toEqual({ a: 1, x: 1 });
        let s1 = 'a:$.x.y,x:y:1';
        let v1 = P(s1);
        // console.log(v1.peg.a)
        expect(v1.peg.a.peg).toEqual(['x', 'y']);
        expect(v1.canon).toEqual('{"a":$.x.y,"x":{"y":1}}');
        expect(G(s1)).toEqual({ a: 1, x: { y: 1 } });
        let s2 = 'a:$.x.y.z,x:y:z:1';
        let v2 = P(s2);
        // console.log(v0)
        expect(v2.peg.a.peg).toEqual(['x', 'y', 'z']);
        expect(v2.canon).toEqual('{"a":$.x.y.z,"x":{"y":{"z":1}}}');
        expect(G(s2)).toEqual({ a: 1, x: { y: { z: 1 } } });
    });
    test('relative-sibling', () => {
        let s0 = 'a:{b:.c,c:1}';
        let v0 = P(s0);
        // console.log(v0)
        expect(v0.peg.a.peg.b.peg).toEqual(['c']);
        expect(v0.canon).toEqual('{"a":{"b":.c,"c":1}}');
        expect(G(s0)).toEqual({ a: { b: 1, c: 1 } });
        let s1 = 'a:{b:.c.d,c:d:1}';
        let v1 = P(s1);
        // console.log(v0)
        expect(v1.peg.a.peg.b.peg).toEqual(['c', 'd']);
        expect(v1.canon).toEqual('{"a":{"b":.c.d,"c":{"d":1}}}');
        expect(G(s1)).toEqual({ a: { b: 1, c: { d: 1 } } });
    });
    test('relative-parent', () => {
        let s0 = 'a:b:c:1,a:d:e:..b.c';
        let v0 = P(s0);
        // console.dir(v0, { depth: null })
        expect(v0.peg.a.peg[1].peg.d.peg.e.peg).toEqual(['.', 'b', 'c']);
        expect(v0.canon).toEqual('{"a":{"b":{"c":1}}&{"d":{"e":..b.c}}}');
        expect(G(s0)).toEqual({ a: { b: { c: 1 }, d: { e: 1 } } });
        let s1 = 'a:b:c:1,a:d:e:...a.b.c';
        let v1 = P(s1);
        // console.dir(v0, { depth: null })
        expect(v1.peg.a.peg[1].peg.d.peg.e.peg).toEqual(['.', '.', 'a', 'b', 'c']);
        expect(v1.canon).toEqual('{"a":{"b":{"c":1}}&{"d":{"e":...a.b.c}}}');
        expect(G(s1)).toEqual({ a: { b: { c: 1 }, d: { e: 1 } } });
    });
    test('key', () => {
        // let s0 = 'a:b:1,c:$.a.b$KEY'
        // let v0 = P(s0)
        // console.log('AAA', v0)
        // expect(v0.canon).toEqual('{"a":{"b":1},"c":$.a.b$KEY}')
        // expect(G(s0)).toEqual({ a: { b: 1 }, c: 'a' })
        // let s1 = 'a:.$KEY'
        // expect(G(s1)).toEqual({ a: '' })
        let s2 = 'a:b:.$KEY';
        expect(G(s2)).toEqual({ a: { b: 'a' } });
        let s3 = 'a:b:c:.$KEY';
        expect(G(s3)).toEqual({ a: { b: { c: 'b' } } });
        let s4 = `
a: { n: .$KEY, x:1 }
b: { c: $.a }
`;
        expect(G(s4)).toEqual({
            a: {
                n: 'a',
                x: 1,
            },
            b: {
                c: {
                    n: 'a', // NOTE: correct as `a` tree is a normal tree
                    x: 1,
                },
            },
        });
        let s5 = `
a: { &: { n: .$KEY } }
`;
        expect(G(s5)).toEqual({ a: {} });
        let s6 = `
a: { &: { n: .$KEY } }
a: { b0: {} }
`;
        expect(G(s6)).toEqual({ a: { b0: { n: 'b0' } } });
        let s10 = `
b: { &: {n:.$KEY} }
b: { c0: { k:0, m:.$KEY }}
b: { c1: { k:1 }}
`;
        // console.dir(G(s3), { depth: null })
        expect(G(s10))
            .toEqual({
            b: {
                c0: { n: 'c0', k: 0, m: 'c0' },
                c1: { n: 'c1', k: 1 }
            }
        });
        // let v1 = P(s1)
        // console.log('AAA', v0)
        // expect(v0.canon).toEqual('{"a":{"b":1},"c":$.a.b$KEY}')
        // expect(G(s1)).toEqual({})
    });
    it('ref', () => {
        let ctx = makeCtx();
        let d0 = new RefVal_1.RefVal({ peg: ['a'] });
        let d1 = new RefVal_1.RefVal({ peg: ['c'], absolute: true });
        let d2 = new RefVal_1.RefVal({ peg: ['a', 'b'] });
        let d3 = new RefVal_1.RefVal({ peg: ['c', 'd', 'e'], absolute: true });
        expect(d0.canon).toEqual('.a');
        expect(d1.canon).toEqual('$.c');
        expect(d2.canon).toEqual('.a.b');
        expect(d3.canon).toEqual('$.c.d.e');
        d0.append('x');
        d1.append('x');
        d2.append('x');
        d3.append('x');
        expect(d0.canon).toEqual('.a.x');
        expect(d1.canon).toEqual('$.c.x');
        expect(d2.canon).toEqual('.a.b.x');
        expect(d3.canon).toEqual('$.c.d.e.x');
        expect(d0.unify(val_1.TOP, ctx).canon).toEqual('.a.x');
        expect(val_1.TOP.unify(d0, ctx).canon).toEqual('.a.x');
        expect(d1.unify(val_1.TOP, ctx).canon).toEqual('$.c.x');
        expect(val_1.TOP.unify(d1, ctx).canon).toEqual('$.c.x');
    });
    it('unify', () => {
        let r1 = new RefVal_1.RefVal({ peg: ['a'] });
        let r2 = new RefVal_1.RefVal({ peg: ['a'] });
        let ctx = makeCtx();
        let u12 = r1.unify(r2, ctx);
        // console.log(u12, r1.id, r2.id)
        expect(r1).toEqual(u12);
        let s0 = `a:$.x,a:$.x,x:1`;
        expect(G(s0)).toEqual({ a: 1, x: 1 });
        let s1 = `x:1,a:$.x,a:$.x`;
        expect(G(s1)).toEqual({ a: 1, x: 1 });
        let s2 = `a:$.x,a:$.x`;
        expect(UC(s2)).toEqual('{"a":$.x}');
    });
    it('spreadable', () => {
        let g0 = G('a:1 x:{&:{y:$.a}} x:m:q:2 x:n:q:3');
        // console.log(g0)
        expect(g0).toEqual({ a: 1, x: { m: { q: 2, y: 1 }, n: { q: 3, y: 1 } } });
        let g1 = G(`a:x:1 b:&:$.a b:c0:k:0 b:c1:k:1`);
        // console.dir(g1, { depth: null })
        expect(g1).toEqual({ a: { x: 1 }, b: { c0: { x: 1, k: 0 }, c1: { x: 1, k: 1 } } });
        let g2 = G(`a:x:1 b:&:{y:2}&$.a b:c0:k:0 b:c1:k:1`);
        // console.dir(g1, { depth: null })
        expect(g2).toEqual({
            a: { x: 1 },
            b: {
                c0: { x: 1, k: 0, y: 2 },
                c1: { x: 1, k: 1, y: 2 }
            }
        });
        let g3 = G(`a:x:1 b:&:{}&$.a b:c0:k:0 b:c1:k:1`);
        // console.dir(g1, { depth: null })
        expect(g3).toEqual({
            a: { x: 1 },
            b: {
                c0: { x: 1, k: 0 },
                c1: { x: 1, k: 1 }
            }
        });
        // let g1 = G('{z:4} & {a:1 x:{&:{y:.a}} x:m:q:2 x:n:q:3}')
        // // console.log(g1)
        // expect(g1).toEqual({ z: 4, a: 1, x: { m: { q: 2, y: 1 }, n: { q: 3, y: 1 } } })
        // let g2 = G('{ x:{&:.a} x:{y:{q:2}} x:{m:{q:3}} } & {a:{z:1}}')
        // // console.log(g2)
        // expect(g2).toEqual({ a: { z: 1 }, x: { y: { z: 1, q: 2 }, m: { z: 1, q: 3 } } })
        // let g3 = G('{}&{a:{z:1},x:{&:.a}&{y:{q:2}}}')
        // // console.log(g3)
        // expect(g3).toEqual({ a: { z: 1 }, x: { y: { z: 1, q: 2 } } })
    });
});
function print(o, t) {
    if (null != t) {
        console.log(t);
    }
    console.dir(o, { depth: null });
}
function makeCtx(r, p) {
    return new unify_1.Context({
        root: r || new MapVal_1.MapVal({ peg: {} }),
        path: p
    });
}

},{"../lib/lang":3,"../lib/unify":8,"../lib/val":9,"../lib/val/MapVal":13,"../lib/val/RefVal":16}],26:[function(require,module,exports){
"use strict";
/* Copyright (c) 2020-2023 Richard Rodger and other contributors, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
const lang_1 = require("../lib/lang");
const unify_1 = require("../lib/unify");
const op_1 = require("../lib/op/op");
const ConjunctVal_1 = require("../lib/val/ConjunctVal");
const DisjunctVal_1 = require("../lib/val/DisjunctVal");
const ListVal_1 = require("../lib/val/ListVal");
const MapVal_1 = require("../lib/val/MapVal");
const Nil_1 = require("../lib/val/Nil");
const PrefVal_1 = require("../lib/val/PrefVal");
const RefVal_1 = require("../lib/val/RefVal");
const VarVal_1 = require("../lib/val/VarVal");
const val_1 = require("../lib/val");
const lang = new lang_1.Lang();
const PL = lang.parse.bind(lang);
const P = (x, ctx) => PL(x, ctx);
const PA = (x, ctx) => x.map(s => PL(s, ctx));
const D = (x) => console.dir(x, { depth: null });
const UC = (s, r) => { var _a; return (_a = (r = P(s)).unify(val_1.TOP, makeCtx(r))) === null || _a === void 0 ? void 0 : _a.canon; };
const G = (x, ctx) => new unify_1.Unify(x, undefined, ctx).res.gen();
const makeST_String = () => new val_1.ScalarTypeVal({ peg: String });
const makeST_Number = () => new val_1.ScalarTypeVal({ peg: Number });
const makeST_Integer = () => new val_1.ScalarTypeVal({ peg: val_1.Integer });
const makeST_Boolean = () => new val_1.ScalarTypeVal({ peg: Boolean });
const makeBooleanVal = (v) => new val_1.BooleanVal({ peg: v });
const makeNumberVal = (v, c) => new val_1.NumberVal({ peg: v }, c);
const makeIntegerVal = (v, c) => new val_1.IntegerVal({ peg: v }, c);
describe('val', function () {
    it('canon', () => {
        expect(P('1').canon).toEqual('1');
        expect(P('"a"').canon).toEqual('"a"');
        expect(P('b').canon).toEqual('"b"');
        expect(P('true').canon).toEqual('true');
        expect(P('top').canon).toEqual('top');
        expect(P('nil').canon).toMatch(/^nil/);
        expect(P('a:1').canon).toEqual('{"a":1}');
        expect(P('a:1,b:nil').canon).toMatch(/^\{"a":1,"b":nil/);
        expect(P('a:1,b:c:2').canon).toEqual('{"a":1,"b":{"c":2}}');
    });
    it('gen', () => {
        expect(P('1').gen()).toEqual(1);
        expect(P('"a"').gen()).toEqual('a');
        expect(P('b').gen()).toEqual('b');
        expect(P('true').gen()).toEqual(true);
        expect(P('top').gen()).toEqual(undefined);
        expect(P('a:1').gen()).toEqual({ a: 1 });
        expect(P('a:1,b:c:2').gen()).toEqual({ a: 1, b: { c: 2 } });
        expect(() => P('nil').gen()).toThrow();
        expect(() => P('a:1,b:nil').gen()).toThrow();
    });
    it('scalartype', () => {
        expect(makeST_String().same(makeST_String())).toBeTruthy();
        expect(makeST_Number().same(makeST_Number())).toBeTruthy();
        expect(makeST_Boolean().same(makeST_Boolean())).toBeTruthy();
        expect(makeST_Integer().same(makeST_Integer())).toBeTruthy();
        expect(makeST_String().same(makeST_Number())).toBeFalsy();
        expect(makeST_String().same(makeST_Boolean())).toBeFalsy();
        expect(makeST_String().same(makeST_Integer())).toBeFalsy();
        expect(makeST_Number().same(makeST_Boolean())).toBeFalsy();
        expect(makeST_Number().same(makeST_Integer())).toBeFalsy();
        expect(makeST_Integer().same(makeST_Boolean())).toBeFalsy();
    });
    it('boolean', () => {
        let ctx = makeCtx();
        let bt = val_1.BooleanVal.TRUE;
        let bf = val_1.BooleanVal.FALSE;
        expect((0, op_1.unite)(ctx, bt, bt)).toEqual(bt);
        expect((0, op_1.unite)(ctx, bf, bf)).toEqual(bf);
        expect((0, op_1.unite)(ctx, bt, bf) instanceof Nil_1.Nil).toBeTruthy();
        expect((0, op_1.unite)(ctx, bf, bt) instanceof Nil_1.Nil).toBeTruthy();
        expect((0, op_1.unite)(ctx, bt, val_1.TOP)).toEqual(bt);
        expect((0, op_1.unite)(ctx, bf, val_1.TOP)).toEqual(bf);
        expect((0, op_1.unite)(ctx, val_1.TOP, bt)).toEqual(bt);
        expect((0, op_1.unite)(ctx, val_1.TOP, bf)).toEqual(bf);
        let b0 = new Nil_1.Nil('test');
        expect((0, op_1.unite)(ctx, bt, b0)).toEqual(b0);
        expect((0, op_1.unite)(ctx, bf, b0)).toEqual(b0);
        expect((0, op_1.unite)(ctx, b0, bt)).toEqual(b0);
        expect((0, op_1.unite)(ctx, b0, bf)).toEqual(b0);
        let bs = makeST_Boolean();
        expect((0, op_1.unite)(ctx, bt, bs)).toEqual(bt);
        expect((0, op_1.unite)(ctx, bs, bt)).toEqual(bt);
        let n0 = makeNumberVal(1);
        expect((0, op_1.unite)(ctx, bt, n0) instanceof Nil_1.Nil).toBeTruthy();
        expect((0, op_1.unite)(ctx, bf, n0) instanceof Nil_1.Nil).toBeTruthy();
        expect((0, op_1.unite)(ctx, n0, bt) instanceof Nil_1.Nil).toBeTruthy();
        expect((0, op_1.unite)(ctx, n0, bf) instanceof Nil_1.Nil).toBeTruthy();
        expect(bt.same(bt)).toBeTruthy();
        expect(bf.same(bf)).toBeTruthy();
        expect(bt.same(bf)).toBeFalsy();
        expect(makeBooleanVal(true).same(makeBooleanVal(true))).toBeTruthy();
        expect(makeBooleanVal(false).same(makeBooleanVal(false))).toBeTruthy();
        expect(makeBooleanVal(true).same(makeBooleanVal(false))).toBeFalsy();
    });
    it('string', () => {
        let ctx = makeCtx();
        let s0 = new val_1.StringVal({ peg: 's0' });
        let s1 = new val_1.StringVal({ peg: 's1' });
        expect((0, op_1.unite)(ctx, s0, s0)).toEqual(s0);
        expect((0, op_1.unite)(ctx, s1, s1)).toEqual(s1);
        expect((0, op_1.unite)(ctx, s0, s1) instanceof Nil_1.Nil).toBeTruthy();
        expect((0, op_1.unite)(ctx, s1, s0) instanceof Nil_1.Nil).toBeTruthy();
        expect((0, op_1.unite)(ctx, s0, val_1.TOP)).toEqual(s0);
        expect((0, op_1.unite)(ctx, s1, val_1.TOP)).toEqual(s1);
        expect((0, op_1.unite)(ctx, val_1.TOP, s0)).toEqual(s0);
        expect((0, op_1.unite)(ctx, val_1.TOP, s1)).toEqual(s1);
        let b0 = new Nil_1.Nil('test');
        expect((0, op_1.unite)(ctx, s0, b0)).toEqual(b0);
        expect((0, op_1.unite)(ctx, s1, b0)).toEqual(b0);
        expect((0, op_1.unite)(ctx, b0, s0)).toEqual(b0);
        expect((0, op_1.unite)(ctx, b0, s1)).toEqual(b0);
        let t0 = makeST_String();
        expect((0, op_1.unite)(ctx, s0, t0)).toEqual(s0);
        expect((0, op_1.unite)(ctx, t0, s0)).toEqual(s0);
        let n0 = makeNumberVal(1);
        expect((0, op_1.unite)(ctx, s0, n0) instanceof Nil_1.Nil).toBeTruthy();
        expect((0, op_1.unite)(ctx, s1, n0) instanceof Nil_1.Nil).toBeTruthy();
        expect((0, op_1.unite)(ctx, n0, s0) instanceof Nil_1.Nil).toBeTruthy();
        expect((0, op_1.unite)(ctx, n0, s1) instanceof Nil_1.Nil).toBeTruthy();
        expect(s0.same(s0)).toBeTruthy();
        expect(new val_1.StringVal({ peg: 'a' }).same(new val_1.StringVal({ peg: 'a' }))).toBeTruthy();
        expect(new val_1.StringVal({ peg: 'a' }).same(new val_1.StringVal({ peg: 'b' }))).toBeFalsy();
    });
    it('number', () => {
        let ctx = makeCtx();
        let n0 = makeNumberVal(0, ctx);
        let n1 = makeNumberVal(1.1, ctx);
        expect((0, op_1.unite)(ctx, n0, n0)).toEqual(n0);
        expect((0, op_1.unite)(ctx, n0, n0)).toEqual(n0);
        expect((0, op_1.unite)(ctx, n1, n1)).toEqual(n1);
        expect((0, op_1.unite)(ctx, n0, n1) instanceof Nil_1.Nil).toBeTruthy();
        expect((0, op_1.unite)(ctx, n1, n0) instanceof Nil_1.Nil).toBeTruthy();
        expect((0, op_1.unite)(ctx, n0, val_1.TOP)).toEqual(n0);
        expect((0, op_1.unite)(ctx, n1, val_1.TOP)).toEqual(n1);
        expect((0, op_1.unite)(ctx, val_1.TOP, n0)).toEqual(n0);
        expect((0, op_1.unite)(ctx, val_1.TOP, n1)).toEqual(n1);
        let b0 = new Nil_1.Nil('test');
        expect((0, op_1.unite)(ctx, n0, b0)).toEqual(b0);
        expect((0, op_1.unite)(ctx, n1, b0)).toEqual(b0);
        expect((0, op_1.unite)(ctx, b0, n0)).toEqual(b0);
        expect((0, op_1.unite)(ctx, b0, n1)).toEqual(b0);
        let t0 = makeST_Number();
        expect((0, op_1.unite)(ctx, n0, t0)).toEqual(n0);
        expect((0, op_1.unite)(ctx, t0, n0)).toEqual(n0);
        let s0 = new val_1.StringVal({ peg: 's0' });
        expect((0, op_1.unite)(ctx, n0, s0) instanceof Nil_1.Nil).toBeTruthy();
        expect((0, op_1.unite)(ctx, n1, s0) instanceof Nil_1.Nil).toBeTruthy();
        expect((0, op_1.unite)(ctx, s0, n0) instanceof Nil_1.Nil).toBeTruthy();
        expect((0, op_1.unite)(ctx, s0, n1) instanceof Nil_1.Nil).toBeTruthy();
        expect(n0.same(n0)).toBeTruthy();
        expect(makeNumberVal(11).same(makeNumberVal(11))).toBeTruthy();
        expect(makeNumberVal(11).same(makeNumberVal(22))).toBeFalsy();
    });
    it('number-unify', () => {
        let n0 = makeIntegerVal(11);
        n0.mark$ = 'n0';
        let n1 = makeIntegerVal(11);
        n1.mark$ = 'n1';
        expect(n0.unify(n1).mark$).toEqual('n0');
        expect(n1.unify(n0).mark$).toEqual('n1');
        let tn0 = makeST_Number();
        let ti0 = makeST_Integer();
        expect(n0.unify(tn0).mark$).toEqual('n0');
        expect(tn0.unify(n0).mark$).toEqual('n0');
        expect(n0.unify(ti0).mark$).toEqual('n0');
        expect(ti0.unify(n0).mark$).toEqual('n0');
        let x0 = makeNumberVal(11);
        x0.mark$ = 'x0';
        let x1 = makeNumberVal(11);
        x1.mark$ = 'x1';
        expect(x0.unify(x1).mark$).toEqual('x0');
        expect(x1.unify(x0).mark$).toEqual('x1');
        expect(x0.unify(tn0).mark$).toEqual('x0');
        expect(tn0.unify(x0).mark$).toEqual('x0');
        expect(x0.unify(ti0).isNil).toEqual(true);
        expect(ti0.unify(x0).isNil).toEqual(true);
        expect(x0.unify(n0).mark$).toEqual('n0');
        expect(n0.unify(x0).mark$).toEqual('n0');
        let x2 = makeNumberVal(2.2);
        x2.mark$ = 'x2';
        expect(x2.unify(tn0).mark$).toEqual('x2');
        expect(tn0.unify(x2).mark$).toEqual('x2');
        expect(x2.unify(ti0).isNil).toEqual(true);
        expect(ti0.unify(x2).isNil).toEqual(true);
        expect(x2.unify(n0).isNil).toEqual(true);
        expect(n0.unify(x2).isNil).toEqual(true);
    });
    it('integer', () => {
        let ctx = makeCtx();
        let n0 = makeIntegerVal(0);
        let n1 = makeIntegerVal(1);
        expect((0, op_1.unite)(ctx, n0, n0)).toEqual(n0);
        expect((0, op_1.unite)(ctx, n1, n1)).toEqual(n1);
        expect((0, op_1.unite)(ctx, n0, n1) instanceof Nil_1.Nil).toBeTruthy();
        expect((0, op_1.unite)(ctx, n1, n0) instanceof Nil_1.Nil).toBeTruthy();
        expect((0, op_1.unite)(ctx, n0, val_1.TOP)).toEqual(n0);
        expect((0, op_1.unite)(ctx, n1, val_1.TOP)).toEqual(n1);
        expect((0, op_1.unite)(ctx, val_1.TOP, n0)).toEqual(n0);
        expect((0, op_1.unite)(ctx, val_1.TOP, n1)).toEqual(n1);
        let b0 = new Nil_1.Nil('test');
        expect((0, op_1.unite)(ctx, n0, b0)).toEqual(b0);
        expect((0, op_1.unite)(ctx, n1, b0)).toEqual(b0);
        expect((0, op_1.unite)(ctx, b0, n0)).toEqual(b0);
        expect((0, op_1.unite)(ctx, b0, n1)).toEqual(b0);
        let s0 = new val_1.StringVal({ peg: 's0' });
        expect((0, op_1.unite)(ctx, n0, s0) instanceof Nil_1.Nil).toBeTruthy();
        expect((0, op_1.unite)(ctx, n1, s0) instanceof Nil_1.Nil).toBeTruthy();
        expect((0, op_1.unite)(ctx, s0, n0) instanceof Nil_1.Nil).toBeTruthy();
        expect((0, op_1.unite)(ctx, s0, n1) instanceof Nil_1.Nil).toBeTruthy();
        let t0 = makeST_Integer();
        expect((0, op_1.unite)(ctx, n0, t0)).toEqual(n0);
        expect((0, op_1.unite)(ctx, t0, n0)).toEqual(n0);
        let t1 = makeST_Number();
        expect((0, op_1.unite)(ctx, n0, t1)).toEqual(n0);
        expect((0, op_1.unite)(ctx, t1, n0)).toEqual(n0);
        expect((0, op_1.unite)(ctx, t0, t1)).toEqual(t0);
        expect((0, op_1.unite)(ctx, t1, t0)).toEqual(t0);
        let x0 = makeNumberVal(0);
        expect((0, op_1.unite)(ctx, n0, x0)).toEqual(n0);
        expect((0, op_1.unite)(ctx, x0, n0)).toEqual(n0);
        expect(n0.same(n0)).toBeTruthy();
        expect(makeIntegerVal(11).same(makeIntegerVal(11))).toBeTruthy();
        expect(makeIntegerVal(11).same(makeIntegerVal(22))).toBeFalsy();
    });
    it('map', () => {
        let ctx = makeCtx();
        let m0 = new MapVal_1.MapVal({ peg: {} });
        expect(m0.canon).toEqual('{}');
        // TODO: update
        expect((0, op_1.unite)(ctx, m0, m0).canon).toEqual('{}');
        expect((0, op_1.unite)(ctx, m0, val_1.TOP).canon).toEqual('{}');
        expect((0, op_1.unite)(ctx, val_1.TOP, m0).canon).toEqual('{}');
        let b0 = new Nil_1.Nil('test');
        expect((0, op_1.unite)(ctx, m0, b0)).toEqual(b0);
        expect((0, op_1.unite)(ctx, b0, m0)).toEqual(b0);
        let s0 = new val_1.StringVal({ peg: 's0' });
        expect((0, op_1.unite)(ctx, m0, s0) instanceof Nil_1.Nil).toBeTruthy();
        expect((0, op_1.unite)(ctx, s0, m0) instanceof Nil_1.Nil).toBeTruthy();
        let n0 = makeNumberVal(0);
        expect((0, op_1.unite)(ctx, m0, n0) instanceof Nil_1.Nil).toBeTruthy();
        expect((0, op_1.unite)(ctx, n0, m0) instanceof Nil_1.Nil).toBeTruthy();
        let t0 = makeST_String();
        expect((0, op_1.unite)(ctx, m0, t0) instanceof Nil_1.Nil).toBeTruthy();
        expect((0, op_1.unite)(ctx, t0, m0) instanceof Nil_1.Nil).toBeTruthy();
        let m1 = new MapVal_1.MapVal({ peg: { a: makeNumberVal(1) } });
        // print(m1, 'm1')
        expect(m1.canon).toEqual('{"a":1}');
        let m1u = m1.unify(val_1.TOP, ctx);
        // print(m1u, 'm1u')
        expect(m1u.canon).toEqual('{"a":1}');
        let u01 = m0.unify(m1, ctx);
        // print(u01, 'u01')
        expect(u01.canon).toEqual('{"a":1}');
        expect(m1u.canon).toEqual('{"a":1}');
        expect(m0.canon).toEqual('{}');
        expect(m1.canon).toEqual('{"a":1}');
        let u02 = m1.unify(m0, ctx);
        // print(u02, 'u02')
        expect(u02.canon).toEqual('{"a":1}');
        expect(m0.canon).toEqual('{}');
        expect(m1.canon).toEqual('{"a":1}');
    });
    it('map', () => {
        let ctx = makeCtx();
        let l0 = new ListVal_1.ListVal({ peg: [] });
        expect(l0.canon).toEqual('[]');
        expect((0, op_1.unite)(ctx, l0, l0).canon).toEqual('[]');
    });
    it('map-spread', () => {
        let ctx = makeCtx();
        let m0 = new MapVal_1.MapVal({
            peg: {
                [MapVal_1.MapVal.SPREAD]: { o: '&', v: P('{x:1}') },
                a: P('{ y: 1 }'),
                b: P('{ y: 2 }'),
            }
        });
        expect(m0.canon).toEqual('{&:{"x":1},"a":{"y":1},"b":{"y":2}}');
        let u0 = m0.unify(val_1.TOP, ctx);
        expect(u0.canon).toEqual('{&:{"x":1},"a":{"y":1,"x":1},"b":{"y":2,"x":1}}');
    });
    it('list-spread', () => {
        let ctx = makeCtx();
        let vals = [
            P('{ y: 1 }'),
            P('{ y: 2 }'),
        ];
        vals[ListVal_1.ListVal.SPREAD] = { o: '&', v: P('{x:1}') };
        let l0 = new ListVal_1.ListVal({ peg: vals });
        expect(l0.canon).toEqual('[&:{"x":1},{"y":1},{"y":2}]');
        let u0 = l0.unify(val_1.TOP, ctx);
        expect(u0.canon).toEqual('[&:{"x":1},{"y":1,"x":1},{"y":2,"x":1}]');
    });
    it('var', () => {
        let q0 = new VarVal_1.VarVal({ peg: 'a' });
        expect(q0.canon).toEqual('$a');
        let ctx = makeCtx();
        ctx.var.foo = makeNumberVal(11);
        let s = 'a:$foo';
        let v0 = P(s, ctx);
        expect(v0.canon).toEqual('{"a":$"foo"}');
        let g0 = G(s, ctx);
        expect(g0).toEqual({ a: 11 });
    });
    it('conjunct', () => {
        let ctx = makeCtx(new MapVal_1.MapVal({ peg: { x: makeIntegerVal(1) } }));
        let d0 = new ConjunctVal_1.ConjunctVal({ peg: PA(['1']) });
        let d1 = new ConjunctVal_1.ConjunctVal({ peg: PA(['1', '1']) });
        let d2 = new ConjunctVal_1.ConjunctVal({ peg: PA(['1', '2']) });
        let d3 = new ConjunctVal_1.ConjunctVal({ peg: PA(['1', 'number']) });
        let d4 = new ConjunctVal_1.ConjunctVal({ peg: PA(['1', 'number', 'integer']) });
        let d5 = new ConjunctVal_1.ConjunctVal({ peg: PA(['{a:1}']) });
        let d6 = new ConjunctVal_1.ConjunctVal({ peg: PA(['{a:1}', '{b:2}']) });
        // let d100 = new ConjunctVal([makeIntegerVal(1), new RefVal({peg:'/x')])
        let d100 = new ConjunctVal_1.ConjunctVal({
            peg: [
                makeIntegerVal(1),
                new RefVal_1.RefVal({ peg: ['x'], absolute: true })
            ]
        });
        expect(d0.canon).toEqual('1');
        expect(d1.canon).toEqual('1&1');
        expect(d2.canon).toEqual('1&2');
        expect(d3.canon).toEqual('1&number');
        expect(d4.canon).toEqual('1&number&integer');
        expect(d5.canon).toEqual('{"a":1}');
        expect(d6.canon).toEqual('{"a":1}&{"b":2}');
        expect((0, op_1.unite)(ctx, d0, P('1')).canon).toEqual('1');
        expect((0, op_1.unite)(ctx, P('1', d0)).canon).toEqual('1');
        expect((0, op_1.unite)(ctx, d0, P('2')).canon)
            .toEqual('nil');
        expect((0, op_1.unite)(ctx, P('2'), d0).canon)
            .toEqual('nil');
        expect((0, op_1.unite)(ctx, d0, val_1.TOP).canon).toEqual('1');
        expect((0, op_1.unite)(ctx, val_1.TOP, d0).canon).toEqual('1');
        expect((0, op_1.unite)(ctx, d1, val_1.TOP).canon).toEqual('1');
        expect((0, op_1.unite)(ctx, val_1.TOP, d1).canon).toEqual('1');
        expect((0, op_1.unite)(ctx, d2, val_1.TOP).canon)
            .toEqual('nil');
        expect((0, op_1.unite)(ctx, val_1.TOP, d2).canon)
            .toEqual('nil');
        expect((0, op_1.unite)(ctx, d3, val_1.TOP).canon).toEqual('1');
        expect((0, op_1.unite)(ctx, val_1.TOP, d3).canon).toEqual('1');
        // TODO: term order is swapped by ConjunctVal impl - should be preserved
        expect((0, op_1.unite)(ctx, d100, val_1.TOP).canon).toEqual('1');
        expect((0, op_1.unite)(ctx, val_1.TOP, d100).canon).toEqual('1');
        // TODO: same for DisjunctVal
        expect((0, op_1.unite)(ctx, new ConjunctVal_1.ConjunctVal({ peg: [] }), val_1.TOP).canon).toEqual('top');
        expect((0, op_1.unite)(ctx, P('1 & .a')).canon).toEqual('1&.a');
        expect((0, op_1.unite)(ctx, P('.a & 1')).canon).toEqual('1&.a');
        expect((0, op_1.unite)(ctx, P('1 & 1 & .a')).canon).toEqual('1&.a');
        expect((0, op_1.unite)(ctx, P('1 & 2')).canon).toEqual('nil');
        expect((0, op_1.unite)(ctx, P('1 & 1 & 2')).canon).toEqual('nil');
        expect((0, op_1.unite)(ctx, P('1 & 1 & .a & 2')).canon).toEqual('nil');
        expect((0, op_1.unite)(ctx, P('1 & 1 & .a & .b')).canon).toEqual('1&.a&.b');
        expect((0, op_1.unite)(ctx, P('1 & 1 & .a & 1 & .b & 1')).canon).toEqual('1&.a&.b');
    });
    it('disjunct', () => {
        let ctx = makeCtx();
        let d1 = new DisjunctVal_1.DisjunctVal({ peg: [P('1'), P('2')] });
        expect((0, op_1.unite)(ctx, d1, P('2')).canon).toEqual('2');
        expect((0, op_1.unite)(ctx, P('1|number')).canon).toEqual('1|number');
        expect((0, op_1.unite)(ctx, P('1|top')).canon).toEqual('1|top');
        expect((0, op_1.unite)(ctx, P('1|number|top')).canon).toEqual('1|number|top');
        expect((0, op_1.unite)(ctx, P('1|number')).gen()).toEqual(1);
        // expect(unite(ctx, P('1|number|top')).gen()).toEqual(undefined)
        expect((0, op_1.unite)(ctx, P('1|number|top')).gen()).toEqual(1);
        expect((0, op_1.unite)(ctx, P('number|1').unify(P('top'))).canon).toEqual('number|1');
        expect((0, op_1.unite)(ctx, P('1|number|1').unify(P('top'))).canon).toEqual('1|number');
        expect((0, op_1.unite)(ctx, P('number|string').unify(P('top'))).canon)
            .toEqual('number|string');
        expect((0, op_1.unite)(ctx, P('number|string').unify(P('1'))).canon).toEqual('1');
        expect((0, op_1.unite)(ctx, P('number|1').unify(P('1'))).canon).toEqual('1');
        expect((0, op_1.unite)(ctx, P('number|1').unify(P('number|1'))).canon).toEqual('number|1');
        expect((0, op_1.unite)(ctx, P('1|number').unify(P('1|number'))).canon).toEqual('1|number');
        expect((0, op_1.unite)(ctx, P('number|1').unify(P('1|number'))).canon).toEqual('1|number');
        expect((0, op_1.unite)(ctx, P('number|1').unify(P('number|string'))).canon)
            .toEqual('number|1');
        expect((0, op_1.unite)(ctx, P('number|string').unify(P('boolean|number'))).canon)
            .toEqual('number');
        expect((0, op_1.unite)(ctx, P('number|*1').unify(P('number|*1'))).canon)
            .toEqual('number|*1');
        let u0 = (0, op_1.unite)(ctx, P('number|*1'), P('number'));
        expect(u0.canon).toEqual('number|*1');
        expect(u0.gen()).toEqual(1);
        let u1 = (0, op_1.unite)(ctx, P('number|*1'), P('number|string'));
        expect(u1.canon).toEqual('number|*1');
        expect(u1.gen()).toEqual(1);
        let u2 = (0, op_1.unite)(ctx, P('number|*1'), P('2'));
        expect(u2.canon).toEqual('2');
        expect(u2.gen()).toEqual(2);
    });
    it('ref-conjunct', () => {
        return;
        /*
            let m0 = P(`
        a: 1
        b: /a
        c: 1 & /a
        d: 1
        e: /d & /a
        f: /b
        `, { xlog: -1 })
      
            let g = []
            g = []; console.log(m0.gen())
      
            let c0 = new Context({ root: m0 })
            let u0 = m0.unify(TOP, c0)
      
            g = []; console.log(u0.gen())
      
            let c0a = new Context({ root: u0 })
            let u0a = u0.unify(TOP, c0a)
      
            g = []; console.log(u0a.gen())
        */
        let m1 = P(`
  u: { x: 1, y: number}
  q: a: .u
  w: b: .q.a & {y:2, z: 3}
  `);
        let u1a = m1.unify(val_1.TOP, new unify_1.Context({ root: m1 }));
        let u1b = u1a.unify(val_1.TOP, new unify_1.Context({ root: u1a }));
    });
    it('unify', () => {
        let m0 = P(`
  a: 1
  b: .a
  c: .x
  `, { xlog: -1 });
        expect(m0.canon).toEqual('{"a":1,"b":.a,"c":.x}');
        let c0 = new unify_1.Context({
            root: m0
        });
        let m0u = m0.unify(val_1.TOP, c0);
        expect(m0u.canon).toEqual('{"a":1,"b":1,"c":.x}');
        let m1 = P(`
  a: .b.c
  b: c: 1
  `, { xlog: -1 });
        let c1 = new unify_1.Context({
            root: m1
        });
        let m1u = m1.unify(val_1.TOP, c1);
        expect(m1u.canon).toEqual('{"a":1,"b":{"c":1}}');
        let m2 = P(`
a: {x:1}
b: { &: $.a }
b: c0: {n:0}
b: c1: {n:1}
b: c2: {n:2}
`);
        expect(m2.canon)
            .toEqual('{"a":{"x":1},"b":{&:$.a}&{"c0":{"n":0}}&{"c1":{"n":1}}&{"c2":{"n":2}}}');
        expect(m2.peg.b.constructor.name).toEqual('ConjunctVal');
        expect(m2.peg.b.peg.length).toEqual(4);
        let c2 = new unify_1.Context({
            root: m2
        });
        let m2u = m2.unify(val_1.TOP, c2);
        expect(m2u.canon)
            // .toEqual('{"a":{"x":1},"b":{&:{"x":1},"c0":{"n":0,"x":1},"c1":{"n":1,"x":1},"c2":{"n":2,"x":1}}}')
            .toEqual('{"a":{"x":1},"b":{&:$.a,"c0":{"x":1,"n":0},"c1":{"x":1,"n":1},"c2":{"x":1,"n":2}}}');
    });
    it('pref', () => {
        let ctx = makeCtx();
        let p0 = new PrefVal_1.PrefVal({ peg: new val_1.StringVal({ peg: 'p0' }) });
        expect(p0.canon).toEqual('*"p0"');
        expect(p0.gen()).toEqual('p0');
        let pu0 = p0.unify(val_1.TOP, ctx);
        expect(pu0).toMatchObject({
            done: -1,
            row: -1,
            col: -1,
            url: '',
            // FIX: use jest toMatchObject
            // peg: {
            //   done: -1,
            //   row: -1,
            //   col: -1,
            //   url: '',
            //   peg: 'p0',
            //   path: [],
            //   type: String,
            // },
            // path: [],
            // pref: {
            //   done: -1,
            //   row: -1,
            //   col: -1,
            //   url: '',
            //   peg: 'p0',
            //   path: [],
            //   type: String,
            // }
        });
        p0.peg = makeST_String();
        expect(p0.canon).toEqual('*"p0"');
        expect(p0.gen()).toEqual('p0');
        // p0.pref = new Nil([], 'test:pref')
        // expect(p0.canon).toEqual('string')
        // expect(p0.gen([])).toEqual(undefined)
        // p0.peg = new Nil([], 'test:val')
        // expect(p0.canon).toEqual('nil')
        // expect(p0.gen([])).toEqual(undefined)
        let p1 = new PrefVal_1.PrefVal({ peg: new val_1.StringVal({ peg: 'p1' }) });
        let p2 = new PrefVal_1.PrefVal({ peg: makeST_String() });
        let up12 = p1.unify(p2, ctx);
        expect(up12.canon).toEqual('*"p1"');
        let up21 = p2.unify(p1, ctx);
        expect(up21.canon).toEqual('*"p1"');
        let up2s0 = p2.unify(new val_1.StringVal({ peg: 's0' }), ctx);
        expect(up2s0.canon).toEqual('*"s0"');
        // NOTE: once made concrete a prefval is fixed
        expect(up2s0.unify(new val_1.StringVal({ peg: 's1' }), ctx).canon)
            .toEqual('nil');
        // let u0 = P('1|number').unify(TOP, ctx)
        // let u1 = P('*1|number').unify(TOP, ctx)
        expect(UC('a:1')).toEqual('{"a":1}');
        expect(UC('a:1,b:.a')).toEqual('{"a":1,"b":1}');
        expect(UC('a:*1|number,b:2,c:.a&.b')).toEqual('{"a":*1|number,"b":2,"c":2}');
        expect(UC('a:*1|number,b:top,c:.a&.b'))
            .toEqual('{"a":*1|number,"b":top,"c":*1|number}');
        expect(UC('a:*1|number,a:*2|number'))
            .toEqual('{"a":*2|*1|number}');
        expect(UC('a:*1|number,b:*2|number,c:.a&.b'))
            .toEqual('{"a":*1|number,"b":*2|number,"c":*2|*1|number}');
        let d0 = P('1|number').unify(val_1.TOP, ctx);
        expect(d0.canon).toEqual('1|number');
        expect(d0.gen()).toEqual(1);
        expect(G('number|*1')).toEqual(1);
        expect(G('string|*1')).toEqual(1);
        // expect(G('a:*1,a:2')).toEqual({ a: undefined })
        expect(() => G('a:*1,a:2')).toThrow();
        // expect(G('*1 & 2')).toEqual(undefined)
        expect(() => G('*1 & 2')).toThrow();
        expect(G('true|*true')).toEqual(true);
        expect(G('*true|true')).toEqual(true);
        expect(G('*true|*true')).toEqual(true);
        expect(G('*true|*true|*true')).toEqual(true);
        expect(G('true&*true')).toEqual(true);
        expect(G('*true&true')).toEqual(true);
        expect(G('*true&*true')).toEqual(true);
        expect(G('{a:2}&{a:number|*1}')).toEqual({ a: 2 });
        expect(G('{&:number}&{a:2}&{a:number|*1}')).toEqual({ a: 2 });
        expect(G('{a:{&:{c:number|*1}}} & {a:{b:{c:2}}}')).toEqual({ a: { b: { c: 2 } } });
        expect(G('{a:{&:{c:number|*1,d:boolean}}} & {a:{b:{c:2,d:true}}}'))
            .toEqual({ a: { b: { c: 2, d: true } } });
        expect(G('x: {a:{&:{c:number|*1,d:boolean}}} & {a:{b:{c:2,d:true}}}'))
            .toEqual({ x: { a: { b: { c: 2, d: true } } } });
        expect(G('x: {a:{&:{c:number|*1}&{d:boolean}}} & {a:{b:{c:2,d:true}}}'))
            .toEqual({ x: { a: { b: { c: 2, d: true } } } });
        expect(G('y: "Y", x: {a:{&:{c:number|*1,d:boolean}}} & {a:{b:{c:2,d:true}}}'))
            .toEqual({ y: 'Y', x: { a: { b: { c: 2, d: true } } } });
        expect(G('y: "Y", x: {a:{&:{c:number|*1,d:boolean,e:$.y}}}' +
            ' & {a:{b:{c:2,d:true}}}'))
            .toEqual({ y: 'Y', x: { a: { b: { c: 2, d: true, e: 'Y' } } } });
        expect(G('y: *"Y"|string, x: {a:{&:{c:number|*1,d:boolean,e:$.y}}}' +
            ' & {a:{b:{c:2,d:true}}}'))
            .toEqual({ y: 'Y', x: { a: { b: { c: 2, d: true, e: 'Y' } } } });
        expect(G('y: *"Y"|string, x: {a:{&:{c:number|*1,d:boolean,e:$.y}}}' +
            ' & {a:{b:{c:2,d:true,e:"Q"}}}'))
            .toEqual({ y: 'Y', x: { a: { b: { c: 2, d: true, e: 'Q' } } } });
        expect(G('y: "Y", x: {a:{&:{c:number|*1}&{d:boolean}}} & {a:{b:{c:2,d:true}}}'))
            .toEqual({ y: 'Y', x: { a: { b: { c: 2, d: true } } } });
        expect(G('y: "Y", x: {a:{&:{c:number|*1}&{d:boolean,e:$.y}}}' +
            ' & {a:{b:{c:2,d:true}}}'))
            .toEqual({ y: 'Y', x: { a: { b: { c: 2, d: true, e: 'Y' } } } });
        expect(G('y: *"Y"|string, x: {a:{&:{c:number|*1}&{d:boolean,e:$.y}}}' +
            ' & {a:{b:{c:2,d:true}}}'))
            .toEqual({ y: 'Y', x: { a: { b: { c: 2, d: true, e: 'Y' } } } });
        expect(G('y: *"Y"|string, x: {a:{&:{c:number|*1}&{d:boolean,e:$.y}}}' +
            ' & {a:{b:{c:2,d:true,e:"Q"}}}'))
            .toEqual({ y: 'Y', x: { a: { b: { c: 2, d: true, e: 'Q' } } } });
        expect(G(`
  a: *true | boolean
  b: $.a
  c: $.a & false
  d: { x: $.a }
  d: { x: false }
  e: { x: $.a }
  f: { &: *true | boolean }
  f: { y: false }
  g: .f
  h: { &: $.a }
  h: { z: false }
  `)).toEqual({
            a: true,
            b: true,
            c: false,
            d: { x: false },
            e: { x: true },
            f: { y: false },
            g: { y: false },
            h: { z: false }
        });
        expect(G(`
  x: y: { m: n: *false | boolean }
  a: b: { &: $.x.y }
  a: b: { c: {} }
  a: b: d: {}
  a: b: e: m: n: true
  `)).toEqual({
            x: { y: { m: { n: false } } },
            a: {
                b: {
                    c: { m: { n: false } },
                    d: { m: { n: false } },
                    e: { m: { n: true } }
                }
            },
        });
    });
});
function print(o, t) {
    if (null != t) {
        console.log(t);
    }
    console.dir(o, { depth: null });
}
function makeCtx(r) {
    return new unify_1.Context({ root: r || new MapVal_1.MapVal({ peg: {} }) });
}

},{"../lib/lang":3,"../lib/op/op":5,"../lib/unify":8,"../lib/val":9,"../lib/val/ConjunctVal":10,"../lib/val/DisjunctVal":11,"../lib/val/ListVal":12,"../lib/val/MapVal":13,"../lib/val/Nil":14,"../lib/val/PrefVal":15,"../lib/val/RefVal":16,"../lib/val/VarVal":18}],27:[function(require,module,exports){
(function (global){(function (){
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{("undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this).JsonicDirective=e()}}((function(){var e={};Object.defineProperty(e,"__esModule",{value:!0}),e.Directive=void 0;const n=e=>("string"==typeof e?e.split(/\s*,\s*/):e||[]).filter(e=>null!=e&&""!==e),l=(e,l)=>{var o,t;let i,s={open:n(null===(o=null==l?void 0:l.rules)||void 0===o?void 0:o.open),close:n(null===(t=null==l?void 0:l.rules)||void 0===t?void 0:t.close)},r=l.name,d=l.open,u=l.close,c=l.custom;if("string"==typeof l.action){let n=l.action;i=l=>l.node=e.util.prop(e.options,n)}else i=l.action;let a={},f="#OD_"+r,p="#CD_"+r,h=e.fixed(d),v=null==u?null:e.fixed(u);if(null!=h)throw new Error("Directive open token already in use: "+d);a[f]=d,null==v&&null!=u&&(a[p]=u),e.options({fixed:{token:a},error:{[r+"_close"]:null==u?null:"directive "+r+' close "'+u+'" without open "'+d+'"'},hint:{[r+"_close"]:null==u?null:`\nThe ${r} directive must start with the characters "${d}" and end\nwith the characters "${u}". The end characters "${u}" may not\nappear without the start characters "${d}" appearing first:\n"${d}...${u}".\n`}});let m=e.token.CA;h=e.fixed(d),v=null==u?null:e.fixed(u),s.open.forEach(n=>{e.rule(n,e=>(e.open({s:[h],p:r,n:{["dr_"+r]:1},g:"start"}),null!=u&&(e.open({s:[h,v],b:1,p:r,n:{["dr_"+r]:1},g:"start,end"}),e.close({s:[v],b:1,g:"end"})),e))}),null!=u&&s.close.forEach(n=>{e.rule(n,e=>{e.close([{s:[v],c:e=>1===e.n["dr_"+r],b:1,g:"end"},{s:[m,v],c:e=>1===e.n["dr_"+r],b:1,g:"end,comma"}])})}),e.rule(r,e=>e.clear().bo(e=>{e.node={}}).open([null!=u?{s:[v],b:1}:null,{p:"val",n:null==u?{dlist:1,dmap:1}:{dlist:0,dmap:0}}]).bc((function(e,n,l,o){let t=i.call(this,e,n,l,o);if(null==t?void 0:t.isToken)return t})).close(null!=u?[{s:[v]},{s:[m,v]}]:[])),c&&c(e,{OPEN:h,CLOSE:v,name:r})};return e.Directive=l,l.defaults={rules:{open:"val",close:"list,elem,map,pair"}},e}));
}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],28:[function(require,module,exports){
(function (global){(function (){
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{("undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this).JsonicExpr=e()}}((function(){var e={exports:{}};(function(t){(function(){!function(n){"object"==typeof e.exports?e.exports=n():("undefined"!=typeof window?window:void 0!==t?t:"undefined"!=typeof self?self:this).Jsonic=n()}((function(){var e=function(e){var t;return function(n){return t||e(t={exports:{},parent:n},t.exports),t.exports}},t=e((function(e,t){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.modlist=t.findTokenSet=t.values=t.keys=t.omap=t.str=t.prop=t.parserwrap=t.trimstk=t.tokenize=t.srcfmt=t.snip=t.regexp=t.mesc=t.makelog=t.isarr=t.filterRules=t.extract=t.escre=t.errinject=t.errdesc=t.entries=t.defprop=t.deep=t.configure=t.clone=t.clean=t.charset=t.badlex=t.assign=t.S=t.JsonicError=void 0;const i=n({}),l=e=>null==e?[]:Object.keys(e);t.keys=l;const o=e=>null==e?[]:Object.values(e);t.values=o;const s=e=>null==e?[]:Object.entries(e);t.entries=s;const a=(e,...t)=>Object.assign(null==e?{}:e,...t);t.assign=a,t.isarr=e=>Array.isArray(e);const c=Object.defineProperty;t.defprop=c;const u=(e,t)=>Object.entries(e||{}).reduce((e,n)=>{let r=t?t(n):n;void 0===r[0]?delete e[n[0]]:e[r[0]]=r[1];let i=2;for(;void 0!==r[i];)e[r[i]]=r[i+1],i+=2;return e},{});t.omap=u;const p={indent:". ",logindent:"  ",space:" ",gap:"  ",Object:"Object",Array:"Array",object:"object",string:"string",function:"function",unexpected:"unexpected",map:"map",list:"list",elem:"elem",pair:"pair",val:"val",node:"node",no_re_flags:r.EMPTY,unprintable:"unprintable",invalid_ascii:"invalid_ascii",invalid_unicode:"invalid_unicode",invalid_lex_state:"invalid_lex_state",unterminated_string:"unterminated_string",unterminated_comment:"unterminated_comment",lex:"lex",parse:"parse",error:"error",none:"none",imp_map:"imp,map",imp_list:"imp,list",imp_null:"imp,null",end:"end",open:"open",close:"close",rule:"rule",stack:"stack",nUll:"null",name:"name",make:"make",colon:":"};t.S=p;class d extends SyntaxError{constructor(e,t,n,r,i){let l=b(e,t=g({},t),n,r,i);super(l.message),a(this,l),v(this)}toJSON(){return{...this,__error:!0,name:this.name,message:this.message,stack:this.stack}}}function f(e,t,n){let i=t.t,l=i[e];return null==l&&r.STRING===typeof e&&(l=t.tI++,i[l]=e,i[e]=l,i[e.substring(1)]=l,null!=n&&a(n.token,t.t)),l}function m(e,...t){return new RegExp(t.map(e=>e.esc?h(e.toString()):e).join(r.EMPTY),null==e?"":e)}function h(e){return null==e?"":e.replace(/[-\\|\]{}()[^$+*?.!=]/g,"\\$&").replace(/\t/g,"\\t").replace(/\r/g,"\\r").replace(/\n/g,"\\n")}function g(e,...t){let n=p.function===typeof e,r=null!=e&&(p.object===typeof e||n);for(let i of t){let t,l=p.function===typeof i,o=null!=i&&(p.object===typeof i||l);if(r&&o&&!l&&Array.isArray(e)===Array.isArray(i))for(let n in i)e[n]=g(e[n],i[n]);else e=void 0===i?e:l?i:o?p.function===typeof(t=i.constructor)&&p.Object!==t.name&&p.Array!==t.name?i:g(Array.isArray(i)?[]:{},i):i,n=p.function===typeof e,r=null!=e&&(p.object===typeof e||n)}return e}function x(e,t,n,r,i,l){let o={code:t,details:n,token:r,rule:i,ctx:l};return null==e?"":e.replace(/\$(\{?)([\w_0-9]+)(\}?)/g,(e,t,s,a)=>{let c=null!=o[s]?o[s]:null!=n[s]?n[s]:l.meta&&null!=l.meta[s]?l.meta[s]:null!=r[s]?r[s]:null!=i[s]?i[s]:null!=l.opts[s]?l.opts[s]:null!=l.cfg[s]?l.cfg[s]:null!=l[s]?l[s]:"$"+s,u=t&&a?c:JSON.stringify(c);return u=null==u?"":u,u.replace(/\n/g,"\n  ")})}function v(e){e.stack&&(e.stack=e.stack.split("\n").filter(e=>!e.includes("jsonic/jsonic")).map(e=>e.replace(/    at /,"at ")).join("\n"))}function k(e,t,n){let i=0<n.sI?n.sI:0,l=0<n.rI?n.rI:1,o=0<n.cI?n.cI:1,s=null==n.src?r.EMPTY:n.src,a=e.substring(Math.max(0,i-333),i).split("\n"),c=e.substring(i,i+333).split("\n"),u=2+(r.EMPTY+(l+2)).length,p=l<3?1:l-2,d=e=>"\x1b[34m"+(r.EMPTY+p++).padStart(u," ")+" | \x1b[0m"+(null==e?r.EMPTY:e),f=a.length;return[2<f?d(a[f-3]):null,1<f?d(a[f-2]):null,d(a[f-1]+c[0])," ".repeat(u)+"   "+" ".repeat(o-1)+"\x1b[31m"+"^".repeat(s.length||1)+" "+t+"\x1b[0m",d(c[1]),d(c[2])].filter(e=>null!=e).join("\n")}function b(e,t,n,r,i){var l,o,s;try{let a=i.cfg,c=i.meta,u=x(a.error[e]||(null===(l=null==t?void 0:t.use)||void 0===l?void 0:l.err)&&(t.use.err.code||t.use.err.message)||a.error.unknown,e,t,n,r,i);p.function===typeof a.hint&&(a.hint={...a.hint(),...a.hint});let d=["\x1b[31m[jsonic/"+e+"]:\x1b[0m "+u,"  \x1b[34m--\x3e\x1b[0m "+(c&&c.fileName||"<no-file>")+":"+n.rI+":"+n.cI,k(i.src(),u,n),"",x((a.hint[e]||(null===(s=null===(o=t.use)||void 0===o?void 0:o.err)||void 0===s?void 0:s.message)||a.hint.unknown||"").trim().split("\n").map(e=>"  "+e).join("\n"),e,t,n,r,i),"","  \x1b[2mhttps://jsonic.senecajs.org\x1b[0m","  \x1b[2m--internal: rule="+r.name+"~"+r.state+"; token="+f(n.tin,i.cfg)+(null==n.why?"":"~"+n.why)+"; plugins="+i.plgn().map(e=>e.name).join(",")+"--\x1b[0m\n"].join("\n"),m={internal:{token:n,ctx:i}};return m={...Object.create(m),message:d,code:e,details:t,meta:c,fileName:c?c.fileName:void 0,lineNumber:n.rI,columnNumber:n.cI},m}catch(a){return console.log(a),{}}}function y(e){return"function"==typeof e.debug.print.src?e.debug.print.src:t=>{let n=null==t?r.EMPTY:Array.isArray(t)?JSON.stringify(t).replace(/]$/,s(t).filter(e=>isNaN(e[0])).map((e,t)=>(0===t?", ":"")+e[0]+": "+JSON.stringify(e[1]))+"]"):JSON.stringify(t);return n=n.substring(0,e.debug.maxlen)+(e.debug.maxlen<n.length?"...":r.EMPTY),n}}function _(e,t=44){let n;try{n="object"==typeof e?JSON.stringify(e):""+e}catch(r){n=""+e}return S(t<n.length?n.substring(0,t-3)+"...":n,t)}function S(e,t=5){return void 0===e?"":(""+e).substring(0,t).replace(/[\r\n\t]/g,".")}function E(...e){return null==e?{}:e.filter(e=>!1!==e).map(e=>"object"==typeof e?l(e).join(r.EMPTY):e).join(r.EMPTY).split(r.EMPTY).reduce((e,t)=>(e[t]=t.charCodeAt(0),e),{})}function j(e){for(let t in e)null==e[t]&&delete e[t];return e}t.JsonicError=d,t.configure=function(e,t,n){var r,i,c,p,d,g,x,v,k,b,y,_,S,O,I,T,M,N,P,C,R,w,A,L,Y,F,$,J,U,K,B,V,D,G,z,Z,q,W,X,H,Q,ee,te,ne,re,ie,le,oe,se,ae;const ce=t||{};ce.t=ce.t||{},ce.tI=ce.tI||1;const ue=e=>f(e,ce);!1!==n.standard$&&(ue("#BD"),ue("#ZZ"),ue("#UK"),ue("#AA"),ue("#SP"),ue("#LN"),ue("#CM"),ue("#NR"),ue("#ST"),ue("#TX"),ue("#VL")),ce.safe={key:!1!==(null===(r=n.safe)||void 0===r?void 0:r.key)},ce.fixed={lex:!!(null===(i=n.fixed)||void 0===i?void 0:i.lex),token:n.fixed?u(j(n.fixed.token),([e,t])=>[t,f(e,ce)]):{},ref:void 0,check:null===(c=n.fixed)||void 0===c?void 0:c.check},ce.fixed.ref=u(ce.fixed.token,([e,t])=>[e,t]),ce.fixed.ref=Object.assign(ce.fixed.ref,u(ce.fixed.ref,([e,t])=>[t,e])),ce.match={lex:!!(null===(p=n.match)||void 0===p?void 0:p.lex),value:n.match?u(j(n.match.value),([e,t])=>[e,t]):{},token:n.match?u(j(n.match.token),([e,t])=>[f(e,ce),t]):{},check:null===(d=n.match)||void 0===d?void 0:d.check},u(ce.match.token,([e,t])=>[e,(t.tin$=+e,t)]);const pe=n.tokenSet?Object.keys(n.tokenSet).reduce((e,t)=>(e[t]=n.tokenSet[t].filter(e=>null!=e).map(e=>ue(e)),e),{}):{};ce.tokenSet=ce.tokenSet||{},s(pe).map(e=>{let t=e[0],n=e[1];ce.tokenSet[t]?(ce.tokenSet[t].length=0,ce.tokenSet[t].push(...n)):ce.tokenSet[t]=n}),ce.tokenSetTins=s(ce.tokenSet).reduce((e,t)=>(e[t[0]]=e[t[0]]||{},t[1].map(n=>e[t[0]][n]=!0),e),{}),ce.tokenSetTins.IGNORE=ce.tokenSetTins.IGNORE||{},ce.space={lex:!!(null===(g=n.space)||void 0===g?void 0:g.lex),chars:E(null===(x=n.space)||void 0===x?void 0:x.chars),check:null===(v=n.space)||void 0===v?void 0:v.check},ce.line={lex:!!(null===(k=n.line)||void 0===k?void 0:k.lex),chars:E(null===(b=n.line)||void 0===b?void 0:b.chars),rowChars:E(null===(y=n.line)||void 0===y?void 0:y.rowChars),single:!!(null===(_=n.line)||void 0===_?void 0:_.single),check:null===(S=n.line)||void 0===S?void 0:S.check},ce.text={lex:!!(null===(O=n.text)||void 0===O?void 0:O.lex),modify:((null===(I=ce.text)||void 0===I?void 0:I.modify)||[]).concat(([null===(T=n.text)||void 0===T?void 0:T.modify]||[]).flat()).filter(e=>null!=e),check:null===(M=n.text)||void 0===M?void 0:M.check},ce.number={lex:!!(null===(N=n.number)||void 0===N?void 0:N.lex),hex:!!(null===(P=n.number)||void 0===P?void 0:P.hex),oct:!!(null===(C=n.number)||void 0===C?void 0:C.oct),bin:!!(null===(R=n.number)||void 0===R?void 0:R.bin),sep:null!=(null===(w=n.number)||void 0===w?void 0:w.sep)&&""!==n.number.sep,exclude:null===(A=n.number)||void 0===A?void 0:A.exclude,sepChar:null===(L=n.number)||void 0===L?void 0:L.sep,check:null===(Y=n.number)||void 0===Y?void 0:Y.check},ce.value={lex:!!(null===(F=n.value)||void 0===F?void 0:F.lex),def:s((null===($=n.value)||void 0===$?void 0:$.def)||{}).reduce((e,t)=>(null==t[1]||!1===t[1]||t[1].match||(e[t[0]]=t[1]),e),{}),defre:s((null===(J=n.value)||void 0===J?void 0:J.def)||{}).reduce((e,t)=>(t[1]&&t[1].match&&(e[t[0]]=t[1],e[t[0]].consume=!!e[t[0]].consume),e),{})},ce.rule={start:null==(null===(U=n.rule)||void 0===U?void 0:U.start)?"val":n.rule.start,maxmul:null==(null===(K=n.rule)||void 0===K?void 0:K.maxmul)?3:n.rule.maxmul,finish:!!(null===(B=n.rule)||void 0===B?void 0:B.finish),include:(null===(V=n.rule)||void 0===V?void 0:V.include)?n.rule.include.split(/\s*,+\s*/).filter(e=>""!==e):[],exclude:(null===(D=n.rule)||void 0===D?void 0:D.exclude)?n.rule.exclude.split(/\s*,+\s*/).filter(e=>""!==e):[]},ce.map={extend:!!(null===(G=n.map)||void 0===G?void 0:G.extend),merge:null===(z=n.map)||void 0===z?void 0:z.merge},ce.list={property:!!(null===(Z=n.list)||void 0===Z?void 0:Z.property)};let de=Object.keys(ce.fixed.token).sort((e,t)=>t.length-e.length).map(e=>h(e)).join("|"),fe=(null===(q=n.comment)||void 0===q?void 0:q.lex)?(n.comment.def?o(n.comment.def):[]).filter(e=>e&&e.lex).map(e=>h(e.start)).join("|"):"",me=["([",h(l(E(ce.space.lex&&ce.space.chars,ce.line.lex&&ce.line.chars)).join("")),"]",("string"==typeof n.ender?n.ender.split(""):Array.isArray(n.ender)?n.ender:[]).map(e=>"|"+h(e)).join(""),""===de?"":"|",de,""===fe?"":"|",fe,"|$)"];return ce.rePart={fixed:de,ender:me,commentStart:fe},ce.re={ender:m(null,...me),rowChars:m(null,h(null===(W=n.line)||void 0===W?void 0:W.rowChars)),columns:m(null,"["+h(null===(X=n.line)||void 0===X?void 0:X.chars)+"]","(.*)$")},ce.lex={empty:!!(null===(H=n.lex)||void 0===H?void 0:H.empty),emptyResult:null===(Q=n.lex)||void 0===Q?void 0:Q.emptyResult,match:(null===(ee=n.lex)||void 0===ee?void 0:ee.match)?s(n.lex.match).reduce((e,t)=>{let r=t[0],i=t[1];if(i){let t=i.make(ce,n);t&&(t.matcher=r,t.make=i.make,t.order=i.order),e.push(t)}return e},[]).filter(e=>null!=e&&!1!==e&&-1<+e.order).sort((e,t)=>e.order-t.order):[]},ce.parse={prepare:o(null===(te=n.parse)||void 0===te?void 0:te.prepare)},ce.debug={get_console:(null===(ne=n.debug)||void 0===ne?void 0:ne.get_console)||(()=>console),maxlen:null==(null===(re=n.debug)||void 0===re?void 0:re.maxlen)?99:n.debug.maxlen,print:{config:!!(null===(le=null===(ie=n.debug)||void 0===ie?void 0:ie.print)||void 0===le?void 0:le.config),src:null===(se=null===(oe=n.debug)||void 0===oe?void 0:oe.print)||void 0===se?void 0:se.src}},ce.error=n.error||{},ce.hint=n.hint||{},(null===(ae=n.config)||void 0===ae?void 0:ae.modify)&&l(n.config.modify).forEach(e=>n.config.modify[e](ce,n)),ce.debug.print.config&&ce.debug.get_console().dir(ce,{depth:null}),ce.result={fail:[]},n.result&&(ce.result.fail=[...n.result.fail]),a(e.options,n),a(e.token,ce.t),a(e.tokenSet,ce.tokenSet),a(e.fixed,ce.fixed.ref),ce},t.tokenize=f,t.findTokenSet=function(e,t){return t.tokenSet[e]},t.mesc=function(e,t){return(t=new String(e)).esc=!0,t},t.regexp=m,t.escre=h,t.deep=g,t.errinject=x,t.trimstk=v,t.extract=k,t.errdesc=b,t.badlex=function(e,t,n){let r=e.next.bind(e);return e.next=(e,i,l,o)=>{let s=r(e,i,l,o);if(t===s.tin){let t={};throw null!=s.use&&(t.use=s.use),new d(s.why||p.unexpected,t,s,e,n)}return s},e},t.makelog=function(e,t){var n,r,i;let l=null===(i=null===(r=null===(n=e.opts)||void 0===n?void 0:n.plugin)||void 0===r?void 0:r.debug)||void 0===i?void 0:i.trace;if(t||l)if("number"==typeof(null==t?void 0:t.log)||l){let n=!1,r=null==t?void 0:t.log;(-1===r||l)&&(r=1,n=!0),e.log=(...t)=>{if(n){let n=t.filter(e=>p.object!=typeof e).map(e=>p.function==typeof e?e.name:e).join(p.gap);e.cfg.debug.get_console().log(n)}else e.cfg.debug.get_console().dir(t,{depth:r})}}else"function"==typeof t.log&&(e.log=t.log);return e.log},t.srcfmt=y,t.str=_,t.snip=S,t.clone=function(e){return g(Object.create(Object.getPrototypeOf(e)),e)},t.charset=E,t.clean=j,t.filterRules=function(e,t){let n=["open","close"];for(let r of n)e.def[r]=e.def[r].map(e=>(e.g="string"==typeof e.g?(e.g||"").split(/\s*,+\s*/):e.g||[],e)).filter(e=>t.rule.include.reduce((t,n)=>t||null!=e.g&&-1!==e.g.indexOf(n),0===t.rule.include.length)).filter(e=>t.rule.exclude.reduce((t,n)=>t&&(null==e.g||-1===e.g.indexOf(n)),!0));return e},t.prop=function(e,t,n){let r=e;try{let r,i=t.split(".");for(let t=0;t<i.length;t++)r=i[t],t<i.length-1&&(e=e[r]=e[r]||{});return void 0!==n&&(e[r]=n),e[r]}catch(i){throw new Error("Cannot "+(void 0===n?"get":"set")+" path "+t+" on object: "+_(r)+(void 0===n?"":" to value: "+_(n,22)))}},t.modlist=function(e,t){if(t&&e){if(0<e.length){if(t.delete&&0<t.delete.length)for(let r=0;r<t.delete.length;r++){let n=t.delete[r];(n<0?-1*n<=e.length:n<e.length)&&(e[(e.length+n)%e.length]=null)}if(t.move)for(let r=0;r<t.move.length;r+=2){let n=(e.length+t.move[r])%e.length,i=(e.length+t.move[r+1])%e.length,l=e[n];e.splice(n,1),e.splice(i,0,l)}let n=e.filter(e=>null!=e);n.length!==e.length&&(e.length=0,e.push(...n))}if(t.custom){let n=t.custom(e);null!=n&&(e=n)}}return e},t.parserwrap=function(e){return{start:function(t,n,l,o){try{return e.start(t,n,l,o)}catch(s){if("SyntaxError"===s.name){let o=0,a=0,c=0,u=r.EMPTY,p=s.message.match(/^Unexpected token (.) .*position\s+(\d+)/i);if(p){u=p[1],o=parseInt(p[2]),a=t.substring(0,o).replace(/[^\n]/g,r.EMPTY).length;let e=o-1;for(;-1<e&&"\n"!==t.charAt(e);)e--;c=Math.max(t.substring(e,o).length,0)}let m=s.token||(0,i.makeToken)("#UK",f("#UK",n.internal().config),void 0,u,(0,i.makePoint)(u.length,o,s.lineNumber||a,s.columnNumber||c));throw new d(s.code||"json",s.details||{msg:s.message},m,{},s.ctx||{uI:-1,opts:n.options,cfg:n.internal().config,token:m,meta:l,src:()=>t,root:()=>{},plgn:()=>n.internal().plugins,inst:()=>n,rule:{name:"no-rule"},sub:{},xs:-1,v2:m,v1:m,t0:m,t1:m,tC:-1,kI:-1,rs:[],rsI:0,rsm:{},n:{},log:l?l.log:void 0,F:y(n.internal().config),use:{},NORULE:{name:"no-rule"},NOTOKEN:{name:"no-token"}})}throw s}}}}})),n=e((function(e,n){"use strict";Object.defineProperty(n,"__esModule",{value:!0}),n.makeTextMatcher=n.makeNumberMatcher=n.makeCommentMatcher=n.makeStringMatcher=n.makeLineMatcher=n.makeSpaceMatcher=n.makeFixedMatcher=n.makeMatchMatcher=n.makeToken=n.makePoint=n.makeLex=n.makeNoToken=void 0;const i=t({});class l{constructor(e,t,n,r){this.len=-1,this.sI=0,this.rI=1,this.cI=1,this.token=[],this.len=e,null!=t&&(this.sI=t),null!=n&&(this.rI=n),null!=r&&(this.cI=r)}toString(){return"Point["+[this.sI+"/"+this.len,this.rI,this.cI]+(0<this.token.length?" "+this.token:"")+"]"}[r.INSPECT](){return this.toString()}}const o=(...e)=>new l(...e);n.makePoint=o;class s{constructor(e,t,n,i,l,o,s){this.isToken=!0,this.name=r.EMPTY,this.tin=-1,this.val=void 0,this.src=r.EMPTY,this.sI=-1,this.rI=-1,this.cI=-1,this.len=-1,this.name=e,this.tin=t,this.src=i,this.val=n,this.sI=l.sI,this.rI=l.rI,this.cI=l.cI,this.use=o,this.why=s,this.len=null==i?0:i.length}resolveVal(e,t){return"function"==typeof this.val?this.val(e,t):this.val}bad(e,t){return this.err=e,null!=t&&(this.use=(0,i.deep)(this.use||{},t)),this}toString(){return"Token["+this.name+"="+this.tin+" "+(0,i.snip)(this.src)+(void 0===this.val||"#ST"===this.name||"#TX"===this.name?"":"="+(0,i.snip)(this.val))+" "+[this.sI,this.rI,this.cI]+(null==this.use?"":" "+(0,i.snip)(""+JSON.stringify(this.use).replace(/"/g,""),22))+(null==this.err?"":" "+this.err)+(null==this.why?"":" "+(0,i.snip)(""+this.why,22))+"]"}[r.INSPECT](){return this.toString()}}const a=(...e)=>new s(...e);function c(e,t,n){let r=e.pnt,i=t;if(e.cfg.fixed.lex&&null!=n&&0<n.length){let l,o=e.cfg.fixed.token[n];null!=o&&(l=e.token(o,void 0,n,r)),null!=l&&(r.sI+=l.src.length,r.cI+=l.src.length,null==t?i=l:r.token.push(l))}return i}n.makeToken=a,n.makeNoToken=()=>a("",-1,void 0,r.EMPTY,o(-1)),n.makeFixedMatcher=(e,t)=>{let n=(0,i.regexp)(null,"^(",e.rePart.fixed,")");return function(t){let r=e.fixed;if(!r.lex)return;if(e.fixed.check){let n=e.fixed.check(t);if(n&&n.done)return n.token}let i=t.pnt,l=t.src.substring(i.sI).match(n);if(l){let e=l[1],n=e.length;if(0<n){let l,o=r.token[e];return null!=o&&(l=t.token(o,void 0,e,i),i.sI+=n,i.cI+=n),l}}}},n.makeMatchMatcher=(e,t)=>{let n=(0,i.values)(e.match.value),r=(0,i.values)(e.match.token);return 0===n.length&&0===r.length?null:function(t,i,l=0){if(!e.match.lex)return;if(e.match.check){let n=e.match.check(t);if(n&&n.done)return n.token}let o=t.pnt,s=t.src.substring(o.sI),a="o"===i.state?0:1;for(let e of n)if(e.match instanceof RegExp){let n=s.match(e.match);if(n){let r=n[0],i=r.length;if(0<i){let l,s=e.val?e.val(n):r;return l=t.token("#VL",s,r,o),o.sI+=i,o.cI+=i,l}}}else{let n=e.match(t,i);if(null!=n)return n}for(let e of r)if(!e.tin$||i.spec.def.tcol[a][l].includes(e.tin$))if(e instanceof RegExp){let n=s.match(e);if(n){let r=n[0],i=r.length;if(0<i){let n,l=e.tin$;return n=t.token(l,r,r,o),o.sI+=i,o.cI+=i,n}}}else{let n=e(t,i);if(null!=n)return n}}},n.makeCommentMatcher=(e,t)=>{let n=t.comment;e.comment={lex:!!n&&!!n.lex,def:((null==n?void 0:n.def)?(0,i.entries)(n.def):[]).reduce((e,[t,n])=>{if(null==n||!1===n)return e;let r={name:t,start:n.start,end:n.end,line:!!n.line,lex:!!n.lex,eatline:!!n.eatline};return e[t]=r,e},{})};let r=e.comment.lex?(0,i.values)(e.comment.def).filter(e=>e.lex&&e.line):[],l=e.comment.lex?(0,i.values)(e.comment.def).filter(e=>e.lex&&!e.line):[];return function(t,n){if(!e.comment.lex)return;if(e.comment.check){let n=e.comment.check(t);if(n&&n.done)return n.token}let o=t.pnt,s=t.src.substring(o.sI),a=o.rI,c=o.cI;for(let i of r)if(s.startsWith(i.start)){let n=s.length,r=i.start.length;for(c+=i.start.length;r<n&&!e.line.chars[s[r]];)c++,r++;if(i.eatline)for(;r<n&&e.line.chars[s[r]];)e.line.rowChars[s[r]]&&a++,r++;let l=s.substring(0,r),u=t.token("#CM",void 0,l,o);return o.sI+=l.length,o.cI=c,o.rI=a,u}for(let r of l)if(s.startsWith(r.start)){let n=s.length,l=r.start.length,u=r.end;for(c+=r.start.length;l<n&&!s.substring(l).startsWith(u);)e.line.rowChars[s[l]]&&(a++,c=0),c++,l++;if(s.substring(l).startsWith(u)){if(c+=u.length,r.eatline)for(;l<n&&e.line.chars[s[l]];)e.line.rowChars[s[l]]&&a++,l++;let i=s.substring(0,l+u.length),p=t.token("#CM",void 0,i,o);return o.sI+=i.length,o.rI=a,o.cI=c,p}return t.bad(i.S.unterminated_comment,o.sI,o.sI+9*r.start.length)}}},n.makeTextMatcher=(e,t)=>{let n=(0,i.regexp)(e.line.lex?null:"s","^(.*?)",...e.rePart.ender);return function(r){if(e.text.check){let t=e.text.check(r);if(t&&t.done)return t.token}let i=e.text,l=r.pnt,o=r.src.substring(l.sI),s=e.value.def,a=e.value.defre,u=o.match(n);if(u){let n,p=u[1],d=u[2];if(null!=p){let t=p.length;if(0<t){let c;if(e.value.lex)if(void 0!==(c=s[p]))n=r.token("#VL",c.val,p,l),l.sI+=t,l.cI+=t;else for(let e in a){let t=a[e];if(t.match){let e=t.match.exec(t.consume?o:p);if(e&&(t.consume||e[0].length===p.length)){let i=e[0];if(null==t.val)n=r.token("#VL",i,i,l);else{let o=t.val(e);n=r.token("#VL",o,i,l)}l.sI+=i.length,l.cI+=i.length}}}null==n&&i.lex&&(n=r.token("#TX",p,p,l),l.sI+=t,l.cI+=t)}}if(n&&(n=c(r,n,d)),n&&0<e.text.modify.length){const i=e.text.modify;for(let l=0;l<i.length;l++)n.val=i[l](n.val,r,e,t)}return n}}},n.makeNumberMatcher=(e,t)=>{let n=e.number,r=(0,i.regexp)(null,["^([-+]?(0(",[n.hex?"x[0-9a-fA-F_]+":null,n.oct?"o[0-7_]+":null,n.bin?"b[01_]+":null].filter(e=>null!=e).join("|"),")|\\.?[0-9]+([0-9_]*[0-9])?)","(\\.[0-9]?([0-9_]*[0-9])?)?","([eE][-+]?[0-9]+([0-9_]*[0-9])?)?"].join("").replace(/_/g,n.sep?(0,i.escre)(n.sepChar):""),")",...e.rePart.ender),l=n.sep?(0,i.regexp)("g",(0,i.escre)(n.sepChar)):void 0;return function(t){if(n=e.number,!n.lex)return;if(e.number.check){let n=e.number.check(t);if(n&&n.done)return n.token}let i=t.pnt,o=t.src.substring(i.sI),s=e.value.def,a=o.match(r);if(a){let n,r=a[1],o=a[9],u=!0;if(null!=r&&(u=!e.number.exclude||!r.match(e.number.exclude))){let o=r.length;if(0<o){let a;if(e.value.lex&&void 0!==(a=s[r]))n=t.token("#VL",a.val,r,i);else{let e=l?r.replace(l,""):r,s=+e;if(isNaN(s)){let t=e[0];"-"!==t&&"+"!==t||(s=("-"===t?-1:1)*+e.substring(1))}isNaN(s)||(n=t.token("#NR",s,r,i),i.sI+=o,i.cI+=o)}}}return u&&(n=c(t,n,o)),n}}},n.makeStringMatcher=(e,t)=>{let n=t.string||{};return e.string=e.string||{},e.string=(0,i.deep)(e.string,{lex:!!(null==n?void 0:n.lex),quoteMap:(0,i.charset)(n.chars),multiChars:(0,i.charset)(n.multiChars),escMap:{...n.escape},escChar:n.escapeChar,escCharCode:null==n.escapeChar?void 0:n.escapeChar.charCodeAt(0),allowUnknown:!!n.allowUnknown,replaceCodeMap:(0,i.omap)((0,i.clean)({...n.replace}),([e,t])=>[e.charCodeAt(0),t]),hasReplace:!1,abandon:!!n.abandon}),e.string.escMap=(0,i.clean)(e.string.escMap),e.string.hasReplace=0<(0,i.keys)(e.string.replaceCodeMap).length,function(t){let n=e.string;if(!n.lex)return;if(e.string.check){let n=e.string.check(t);if(n&&n.done)return n.token}let{quoteMap:l,escMap:o,escChar:s,escCharCode:a,multiChars:c,allowUnknown:u,replaceCodeMap:p,hasReplace:d}=n,{pnt:f,src:m}=t,{sI:h,rI:g,cI:x}=f,v=m.length;if(l[m[h]]){const l=m[h],k=h,b=g,y=c[l];++h,++x;let _,S=[];for(;h<v;h++){x++;let r=m[h];if(_=void 0,l===r){h++;break}if(s===r){h++,x++;let e=o[m[h]];if(null!=e)S.push(e);else if("x"===m[h]){h++;let e=parseInt(m.substring(h,h+2),16);if(isNaN(e)){if(n.abandon)return;return h-=2,x-=2,f.sI=h,f.cI=x,t.bad(i.S.invalid_ascii,h,h+4)}let r=String.fromCharCode(e);S.push(r),h+=1,x+=2}else if("u"===m[h]){h++;let e="{"===m[h]?(h++,1):0,r=e?6:4,l=parseInt(m.substring(h,h+r),16);if(isNaN(l)){if(n.abandon)return;return h=h-2-e,x-=2,f.sI=h,f.cI=x,t.bad(i.S.invalid_unicode,h,h+r+2+2*e)}let o=String.fromCodePoint(l);S.push(o),h+=r-1+e,x+=r+e}else{if(!u){if(n.abandon)return;return f.sI=h,f.cI=x-1,t.bad(i.S.unexpected,h,h+1)}S.push(m[h])}}else if(d&&void 0!==(_=p[m.charCodeAt(h)]))S.push(_),x++;else{let r=h,o=l.charCodeAt(0),s=m.charCodeAt(h);for(;(!d||void 0===(_=p[s]))&&h<v&&32<=s&&o!==s&&a!==s;)s=m.charCodeAt(++h),x++;if(x--,void 0===_&&s<32){if(!y||!e.line.chars[m[h]]){if(n.abandon)return;return f.sI=h,f.cI=x,t.bad(i.S.unprintable,h,h+1)}e.line.rowChars[m[h]]&&(f.rI=++g),x=1,S.push(m.substring(r,h+1))}else S.push(m.substring(r,h)),h--}}if(m[h-1]!==l||f.sI===h-1){if(n.abandon)return;return f.rI=b,t.bad(i.S.unterminated_string,k,h)}const E=t.token("#ST",S.join(r.EMPTY),m.substring(f.sI,h),f);return f.sI=h,f.rI=g,f.cI=x,E}}},n.makeLineMatcher=(e,t)=>function(t){if(!e.line.lex)return;if(e.line.check){let n=e.line.check(t);if(n&&n.done)return n.token}let n,{chars:r,rowChars:i}=e.line,{pnt:l,src:o}=t,{sI:s,rI:a}=l,c=e.line.single;for(c&&(n={});r[o[s]]&&!(n&&(n[o[s]]=(n[o[s]]||0)+1,c&&1<n[o[s]]));)a+=i[o[s]]?1:0,s++;if(l.sI<s){let e=o.substring(l.sI,s);const n=t.token("#LN",void 0,e,l);return l.sI+=e.length,l.rI=a,l.cI=1,n}},n.makeSpaceMatcher=(e,t)=>function(t){if(!e.space.lex)return;if(e.space.check){let n=e.space.check(t);if(n&&n.done)return n.token}let{chars:n}=e.space,{pnt:r,src:i}=t,{sI:l,cI:o}=r;for(;n[i[l]];)l++,o++;if(r.sI<l){let e=i.substring(r.sI,l);const n=t.token("#SP",void 0,e,r);return r.sI+=e.length,r.cI=o,n}};class u{constructor(e){this.src=r.EMPTY,this.ctx={},this.cfg={},this.pnt=o(-1),this.ctx=e,this.src=e.src(),this.cfg=e.cfg,this.pnt=o(this.src.length)}token(e,t,n,r,l,o){let s,c;return"string"==typeof e?(c=e,s=(0,i.tokenize)(c,this.cfg)):(s=e,c=(0,i.tokenize)(e,this.cfg)),a(c,s,t,n,r||this.pnt,l,o)}next(e,t,n,r){let l,o,s=this.pnt,a=s.sI;if(s.end)l=s.end;else if(0<s.token.length)l=s.token.shift();else if(s.len<=s.sI)s.end=this.token("#ZZ",void 0,"",s),l=s.end;else{try{for(let t of this.cfg.lex.match)if(l=t(this,e,r)){o=t;break}}catch(c){l=l||this.token("#BD",void 0,this.src[s.sI],s,{err:c},c.code||i.S.unexpected)}l=l||this.token("#BD",void 0,this.src[s.sI],s,void 0,i.S.unexpected)}return this.ctx.log&&this.ctx.log(i.S.lex,this.ctx,e,this,s,a,o,l,t,n,r),this.ctx.sub.lex&&this.ctx.sub.lex.map(t=>t(l,e,this.ctx)),l}tokenize(e){return(0,i.tokenize)(e,this.cfg)}bad(e,t,n){return this.token("#BD",void 0,0<=t&&t<=n?this.src.substring(t,n):this.src[this.pnt.sI],void 0,void 0,e)}}n.makeLex=(...e)=>new u(...e)})),r={};Object.defineProperty(r,"__esModule",{value:!0}),r.STRING=r.INSPECT=r.EMPTY=r.AFTER=r.BEFORE=r.CLOSE=r.OPEN=void 0,r.OPEN="o",r.CLOSE="c",r.BEFORE="b",r.AFTER="a",r.EMPTY="",r.INSPECT=Symbol.for("nodejs.util.inspect.custom"),r.STRING="string";var i={};Object.defineProperty(i,"__esModule",{value:!0}),i.defaults=void 0;const l=n({}),o={safe:{key:!0},tag:"-",fixed:{lex:!0,token:{"#OB":"{","#CB":"}","#OS":"[","#CS":"]","#CL":":","#CA":","}},match:{lex:!0,token:{}},tokenSet:{IGNORE:["#SP","#LN","#CM"],VAL:["#TX","#NR","#ST","#VL"],KEY:["#TX","#NR","#ST","#VL"]},space:{lex:!0,chars:" \t"},line:{lex:!0,chars:"\r\n",rowChars:"\n",single:!1},text:{lex:!0},number:{lex:!0,hex:!0,oct:!0,bin:!0,sep:"_",exclude:void 0},comment:{lex:!0,def:{hash:{line:!0,start:"#",lex:!0,eatline:!1},slash:{line:!0,start:"//",lex:!0,eatline:!1},multi:{line:!1,start:"/*",end:"*/",lex:!0,eatline:!1}}},string:{lex:!0,chars:"'\"`",multiChars:"`",escapeChar:"\\",escape:{b:"\b",f:"\f",n:"\n",r:"\r",t:"\t",v:"\v",'"':'"',"'":"'","`":"`","\\":"\\","/":"/"},allowUnknown:!0,abandon:!1},map:{extend:!0,merge:void 0},list:{property:!0},value:{lex:!0,def:{true:{val:!0},false:{val:!1},null:{val:null}}},ender:[],plugin:{},debug:{get_console:()=>console,maxlen:99,print:{config:!1,src:void 0}},error:{unknown:"unknown error: $code",unexpected:"unexpected character(s): $src",invalid_unicode:"invalid unicode escape: $src",invalid_ascii:"invalid ascii escape: $src",unprintable:"unprintable character: $src",unterminated_string:"unterminated string: $src",unterminated_comment:"unterminated comment: $src",unknown_rule:"unknown rule: $rulename"},hint:function(e=((e,t="replace")=>e[t](/[A-Z]/g,e=>" "+e.toLowerCase())[t](/[~%][a-z]/g,e=>("~"==e[0]?" ":"")+e[1].toUpperCase())),t="~sinceTheErrorIsUnknown,ThisIsProbablyABugInsideJsonic\nitself,OrAPlugin.~pleaseConsiderPostingAGithubIssue -Thanks!\n\n~code: $code,~details: \n$details|~theCharacter(s) $srcWereNotExpectedAtThisPointAsTheyDoNot\nmatchTheExpectedSyntax,EvenUnderTheRelaxedJsonicRules.~ifIt\nisNotObviouslyWrong,TheActualSyntaxErrorMayBeElsewhere.~try\ncommentingOutLargerAreasAroundThisPointUntilYouGetNoErrors,\nthenRemoveTheCommentsInSmallSectionsUntilYouFindThe\noffendingSyntax.~n%o%t%e:~alsoCheckIfAnyPluginsYouAreUsing\nexpectDifferentSyntaxInThisCase.|~theEscapeSequence $srcDoesNotEncodeAValidUnicodeCodePoint\nnumber.~youMayNeedToValidateYourStringDataManuallyUsingTest\ncodeToSeeHow~javaScriptWillInterpretIt.~alsoConsiderThatYour\ndataMayHaveBecomeCorrupted,OrTheEscapeSequenceHasNotBeen\ngeneratedCorrectly.|~theEscapeSequence $srcDoesNotEncodeAValid~a%s%c%i%iCharacter.~you\nmayNeedToValidateYourStringDataManuallyUsingTestCodeToSee\nhow~javaScriptWillInterpretIt.~alsoConsiderThatYourDataMay\nhaveBecomeCorrupted,OrTheEscapeSequenceHasNotBeenGenerated\ncorrectly.|~stringValuesCannotContainUnprintableCharacters (characterCodes\nbelow 32).~theCharacter $srcIsUnprintable.~youMayNeedToRemove\ntheseCharactersFromYourSourceData.~alsoCheckThatItHasNot\nbecomeCorrupted.|~thisStringHasNoEndQuote.|~thisCommentIsNeverClosed.|~noRuleNamed $rulenameIsDefined.~thisIsProbablyAnErrorInThe\ngrammarOfAPlugin.".split("|")){return"unknown|unexpected|invalid_unicode|invalid_ascii|unprintable|unterminated_string|unterminated_comment|unknown_rule".split("|").reduce((n,r,i)=>(n[r]=e(t[i]),n),{})},lex:{match:{match:{order:1e6,make:l.makeMatchMatcher},fixed:{order:2e6,make:l.makeFixedMatcher},space:{order:3e6,make:l.makeSpaceMatcher},line:{order:4e6,make:l.makeLineMatcher},string:{order:5e6,make:l.makeStringMatcher},comment:{order:6e6,make:l.makeCommentMatcher},number:{order:7e6,make:l.makeNumberMatcher},text:{order:8e6,make:l.makeTextMatcher}},empty:!0,emptyResult:void 0},parse:{prepare:{}},rule:{start:"val",finish:!0,maxmul:3,include:"",exclude:""},result:{fail:[]},config:{modify:{}},parser:{start:void 0}};i.defaults=o;var s={};Object.defineProperty(s,"__esModule",{value:!0}),s.makeRuleSpec=s.makeNoRule=s.makeRule=void 0;const a=t({});class c{constructor(e,t,n){this.i=-1,this.name=r.EMPTY,this.node=null,this.state=r.OPEN,this.n=Object.create(null),this.d=-1,this.u=Object.create(null),this.k=Object.create(null),this.bo=!1,this.ao=!1,this.bc=!1,this.ac=!1,this.os=0,this.cs=0,this.need=0,this.i=t.uI++,this.name=e.name,this.spec=e,this.child=t.NORULE,this.parent=t.NORULE,this.prev=t.NORULE,this.o0=t.NOTOKEN,this.o1=t.NOTOKEN,this.c0=t.NOTOKEN,this.c1=t.NOTOKEN,this.node=n,this.d=t.rsI,this.bo=null!=e.def.bo,this.ao=null!=e.def.ao,this.bc=null!=e.def.bc,this.ac=null!=e.def.ac}process(e,t){return this.spec.process(this,e,t,this.state)}eq(e,t=0){let n=this.n[e];return null==n||n===t}lt(e,t=0){let n=this.n[e];return null==n||n<t}gt(e,t=0){let n=this.n[e];return null==n||n>t}lte(e,t=0){let n=this.n[e];return null==n||n<=t}gte(e,t=0){let n=this.n[e];return null==n||n>=t}toString(){return"[Rule "+this.name+"~"+this.i+"]"}}const u=(...e)=>new c(...e);s.makeRule=u,s.makeNoRule=e=>u(g(e.cfg,{}),e);class p{constructor(){this.p=r.EMPTY,this.r=r.EMPTY,this.b=0}}const d=(...e)=>new p(...e),f=d(),m=d();class h{constructor(e,t){this.name=r.EMPTY,this.def={open:[],close:[],bo:[],bc:[],ao:[],ac:[],tcol:[]},this.cfg=e,this.def=Object.assign(this.def,t),this.def.open=(this.def.open||[]).filter(e=>null!=e),this.def.close=(this.def.close||[]).filter(e=>null!=e);for(let n of[...this.def.open,...this.def.close])x(n)}tin(e){return(0,a.tokenize)(e,this.cfg)}add(e,t,n){let r=(null==n?void 0:n.append)?"push":"unshift",i=((0,a.isarr)(t)?t:[t]).filter(e=>null!=e&&"object"==typeof e).map(e=>x(e)),l="o"===e?"open":"close",o=this.def[l];return o[r](...i),o=this.def[l]=(0,a.modlist)(o,n),(0,a.filterRules)(this,this.cfg),this.norm(),this}open(e,t){return this.add("o",e,t)}close(e,t){return this.add("c",e,t)}action(e,t,n,r){let i=this.def[t+n];return e?i.push(r):i.unshift(r),this}bo(e,t){return this.action(!t||!!e,r.BEFORE,r.OPEN,t||e)}ao(e,t){return this.action(!t||!!e,r.AFTER,r.OPEN,t||e)}bc(e,t){return this.action(!t||!!e,r.BEFORE,r.CLOSE,t||e)}ac(e,t){return this.action(!t||!!e,r.AFTER,r.CLOSE,t||e)}clear(){return this.def.open.length=0,this.def.close.length=0,this.def.bo.length=0,this.def.ao.length=0,this.def.bc.length=0,this.def.ac.length=0,this}norm(){this.def.open.map(e=>x(e)),this.def.close.map(e=>x(e));const e=[];function t(e,t,n){return n[e]=n[e]||[],[function(e,n){if(n.s&&n.s[t]){let r=[...new Set(e.concat(n.s[t]))];e.length=0,e.push(...r)}return e},n[e][t]=n[e][t]||[]]}return this.def.open.reduce(...t(0,0,e)),this.def.open.reduce(...t(0,1,e)),this.def.close.reduce(...t(1,0,e)),this.def.close.reduce(...t(1,1,e)),this.def.tcol=e,this}process(e,t,n,i){t.log&&t.log(a.S.rule,t,e,n);let l="o"===i,o=l?e:t.NORULE,s=l?"O":"C",c=this.def,p=l?c.open:c.close,d=l?e.bo?c.bo:null:e.bc?c.bc:null;if(d){let n;for(let r=0;r<d.length;r++)if(n=d[r].call(this,e,t,o,n),(null==n?void 0:n.isToken)&&(null==n?void 0:n.err))return this.bad(n,e,t,{is_open:l})}let h=0<p.length?function(e,t,n,i,l){let o=f;o.b=0,o.p=r.EMPTY,o.r=r.EMPTY,o.n=void 0,o.h=void 0,o.a=void 0,o.u=void 0,o.k=void 0,o.e=void 0;let s=null,c=0,u=!0,p=1<<l.cfg.t.AA-1,d=l.cfg.tokenSetTins.IGNORE;function m(e,t,r,i){let o;do{o=n.next(e,t,r,i),l.tC++}while(d[o.tin]);return o}let h=t.length;for(c=0;c<h;c++){s=t[c];let n=!1,r=!1;if(u=!0,s.S0){let e=(l.t0=l.NOTOKEN!==l.t0?l.t0:l.t0=m(i,s,c,0)).tin;if(n=!0,u=!!(s.S0[e/31|0]&(1<<e%31-1|p)),u&&(r=null!=s.S1,s.S1)){let e=(l.t1=l.NOTOKEN!==l.t1?l.t1:l.t1=m(i,s,c,1)).tin;r=!0,u=!!(s.S1[e/31|0]&(1<<e%31-1|p))}}if(e?(i.o0=n?l.t0:l.NOTOKEN,i.o1=r?l.t1:l.NOTOKEN,i.os=(n?1:0)+(r?1:0)):(i.c0=n?l.t0:l.NOTOKEN,i.c1=r?l.t1:l.NOTOKEN,i.cs=(n?1:0)+(r?1:0)),u&&s.c&&(u=u&&s.c(i,l,o)),u)break;s=null}u||(o.e=l.t0),s&&(o.n=null!=s.n?s.n:o.n,o.h=null!=s.h?s.h:o.h,o.a=null!=s.a?s.a:o.a,o.u=null!=s.u?s.u:o.u,o.k=null!=s.k?s.k:o.k,o.g=null!=s.g?s.g:o.g,o.e=s.e&&s.e(i,l,o)||void 0,o.p=null!=s.p&&!1!==s.p?"string"==typeof s.p?s.p:s.p(i,l,o):o.p,o.r=null!=s.r&&!1!==s.r?"string"==typeof s.r?s.r:s.r(i,l,o):o.r,o.b=null!=s.b&&!1!==s.b?"number"==typeof s.b?s.b:s.b(i,l,o):o.b);let g=c<t.length;return l.log&&l.log(a.S.parse,l,i,n,g,u,c,s,o),o}(l,p,n,e,t):m;if(h.h&&(h=h.h(e,t,h,o)||h,s+="H"),h.e)return this.bad(h.e,e,t,{is_open:l});if(h.n)for(let r in h.n)e.n[r]=0===h.n[r]?0:(null==e.n[r]?0:e.n[r])+h.n[r];if(h.u&&(e.u=Object.assign(e.u,h.u)),h.k&&(e.k=Object.assign(e.k,h.k)),h.a){s+="A";let n=h.a(e,t,h);if(n&&n.isToken&&n.err)return this.bad(n,e,t,{is_open:l})}if(h.p){t.rs[t.rsI++]=e;let n=t.rsm[h.p];if(!n)return this.bad(this.unknownRule(t.t0,h.p),e,t,{is_open:l});o=e.child=u(n,t,e.node),o.parent=e,o.n={...e.n},0<Object.keys(e.k).length&&(o.k={...e.k}),s+="P`"+h.p+"`"}else if(h.r){let n=t.rsm[h.r];if(!n)return this.bad(this.unknownRule(t.t0,h.r),e,t,{is_open:l});o=u(n,t,e.node),o.parent=e.parent,o.prev=e,o.n={...e.n},0<Object.keys(e.k).length&&(o.k={...e.k}),s+="R`"+h.r+"`"}else l||(o=t.rs[--t.rsI]||t.NORULE);let g=l?e.ao?c.ao:null:e.ac?c.ac:null;if(g){let n;for(let r=0;r<g.length;r++)if(n=g[r](e,t,o,n),(null==n?void 0:n.isToken)&&(null==n?void 0:n.err))return this.bad(n,e,t,{is_open:l})}o.why=s,t.log&&t.log(a.S.node,t,e,n,o),r.OPEN===e.state&&(e.state=r.CLOSE);let x=e[l?"os":"cs"]-(h.b||0);return 1===x?(t.v2=t.v1,t.v1=t.t0,t.t0=t.t1,t.t1=t.NOTOKEN):2==x&&(t.v2=t.t1,t.v1=t.t0,t.t0=t.NOTOKEN,t.t1=t.NOTOKEN),o}bad(e,t,n,r){throw new a.JsonicError(e.err||a.S.unexpected,{...e.use,state:r.is_open?a.S.open:a.S.close},e,t,n)}unknownRule(e,t){return e.err="unknown_rule",e.use=e.use||{},e.use.rulename=t,e}}const g=(...e)=>new h(...e);function x(e){if(r.STRING===typeof e.g?e.g=e.g.split(/\s*,\s*/):null==e.g&&(e.g=[]),e.g=e.g.sort(),e.s&&0!==e.s.length){const t=e=>e.flat().filter(e=>"number"==typeof e),n=(e,t)=>e.filter(e=>31*t<=e&&e<31*(t+1)),r=(e,t)=>e.reduce((e,n)=>1<<n-(31*t+1)|e,0),i=t([e.s[0]]),l=t([e.s[1]]),o=e;o.S0=0<i.length?new Array(Math.max(...i.map(e=>1+e/31|0))).fill(null).map((e,t)=>t).map(e=>r(n(i,e),e)):null,o.S1=0<l.length?new Array(Math.max(...l.map(e=>1+e/31|0))).fill(null).map((e,t)=>t).map(e=>r(n(l,e),e)):null}else e.s=null;return e.p||(e.p=null),e.r||(e.r=null),e.b||(e.b=null),e}s.makeRuleSpec=g;var v={};Object.defineProperty(v,"__esModule",{value:!0}),v.makeParser=v.makeRuleSpec=v.makeRule=void 0;const k=t({}),b=n({});Object.defineProperty(v,"makeRule",{enumerable:!0,get:function(){return s.makeRule}}),Object.defineProperty(v,"makeRuleSpec",{enumerable:!0,get:function(){return s.makeRuleSpec}});class y{constructor(e,t){this.rsm={},this.options=e,this.cfg=t}rule(e,t){if(null==e)return this.rsm;let n=this.rsm[e];if(null===t)delete this.rsm[e];else if(void 0!==t)return n=this.rsm[e]=this.rsm[e]||(0,s.makeRuleSpec)(this.cfg,{}),n=this.rsm[e]=t(this.rsm[e],this)||this.rsm[e],void(n.name=e);return n}start(e,t,n,i){let l,o=(0,b.makeToken)("#ZZ",(0,k.tokenize)("#ZZ",this.cfg),void 0,r.EMPTY,(0,b.makePoint)(-1)),a=(0,b.makeNoToken)(),c={uI:0,opts:this.options,cfg:this.cfg,meta:n||{},src:()=>e,root:()=>l,plgn:()=>t.internal().plugins,inst:()=>t,rule:{},sub:t.internal().sub,xs:-1,v2:o,v1:o,t0:a,t1:a,tC:-2,kI:-1,rs:[],rsI:0,rsm:this.rsm,log:void 0,F:(0,k.srcfmt)(this.cfg),use:{},NOTOKEN:a,NORULE:{}};c=(0,k.deep)(c,i);let u=(0,s.makeNoRule)(c);if(c.NORULE=u,c.rule=u,n&&k.S.function===typeof n.log&&(c.log=n.log),this.cfg.parse.prepare.forEach(e=>e(t,c,n)),""===e){if(this.cfg.lex.empty)return this.cfg.lex.emptyResult;throw new k.JsonicError(k.S.unexpected,{src:e},c.t0,u,c)}let p=(0,k.badlex)((0,b.makeLex)(c),(0,k.tokenize)("#BD",this.cfg),c),d=this.rsm[this.cfg.rule.start];if(null==d)return;let f=(0,s.makeRule)(d,c);l=f;let m=2*(0,k.keys)(this.rsm).length*p.src.length*2*c.cfg.rule.maxmul,h=0;for(;u!==f&&h<m;)c.kI=h,c.rule=f,c.log&&c.log("",c.kI+":"),c.sub.rule&&c.sub.rule.map(e=>e(f,c)),f=f.process(c,p),c.log&&c.log(k.S.stack,c,f,p),h++;if(o.tin!==p.next(f).tin)throw new k.JsonicError(k.S.unexpected,{},c.t0,u,c);const g=c.root().node;if(this.cfg.result.fail.includes(g))throw new k.JsonicError(k.S.unexpected,{},c.t0,u,c);return g}clone(e,t){let n=new y(e,t);return n.rsm=Object.keys(this.rsm).reduce((e,t)=>(e[t]=(0,k.filterRules)(this.rsm[t],this.cfg),e),{}),n.norm(),n}norm(){(0,k.values)(this.rsm).map(e=>e.norm())}}v.makeParser=(...e)=>new y(...e);var _={};function S(e){const{deep:t}=e.util,{OB:n,CB:r,OS:i,CS:l,CL:o,CA:s,TX:a,ST:c,ZZ:u}=e.token,{VAL:p,KEY:d}=e.tokenSet,f=(e,t)=>{if(!t.cfg.rule.finish)return t.t0.src="END_OF_SOURCE",t.t0},m=e=>{const t=e.o0,n=c===t.tin||a===t.tin?t.val:t.src;e.u.key=n};e.rule("val",e=>{e.bo(e=>e.node=void 0).open([{s:[n],p:"map",b:1,g:"map,json"},{s:[i],p:"list",b:1,g:"list,json"},{s:[p],g:"val,json"}]).close([{s:[u],g:"end,json"},{b:1,g:"more,json"}]).bc((e,t)=>{e.node=void 0===e.node?void 0===e.child.node?0===e.os?void 0:e.o0.resolveVal(e,t):e.child.node:e.node})}),e.rule("map",e=>{e.bo(e=>{e.node=Object.create(null)}).open([{s:[n,r],b:1,n:{pk:0},g:"map,json"},{s:[n],p:"pair",n:{pk:0},g:"map,json,pair"}]).close([{s:[r],g:"end,json"}])}),e.rule("list",e=>{e.bo(e=>{e.node=[]}).open([{s:[i,l],b:1,g:"list,json"},{s:[i],p:"elem",g:"list,elem,json"}]).close([{s:[l],g:"end,json"}])}),e.rule("pair",e=>{e.open([{s:[d,o],p:"val",u:{pair:!0},a:m,g:"map,pair,key,json"}]).bc((e,t)=>{e.u.pair&&(e.u.prev=e.node[e.u.key],e.node[e.u.key]=e.child.node)}).close([{s:[s],r:"pair",g:"map,pair,json"},{s:[r],b:1,g:"map,pair,json"}])}),e.rule("elem",e=>{e.open([{p:"val",g:"list,elem,val,json"}]).bc(e=>{!0!==e.u.done&&e.node.push(e.child.node)}).close([{s:[s],r:"elem",g:"list,elem,json"},{s:[l],b:1,g:"list,elem,json"}])});const h=(e,n)=>{let r=e.u.key,i=e.child.node;const l=e.u.prev;i=void 0===i?null:i,e.u.list&&n.cfg.safe.key&&("__proto__"===r||"constructor"===r)||(e.node[r]=null==l?i:n.cfg.map.merge?n.cfg.map.merge(l,i,e,n):n.cfg.map.extend?t(l,i):i)};e.rule("val",e=>{e.open([{s:[d,o],p:"map",b:2,n:{pk:1},g:"pair,jsonic"},{s:[p],g:"val,json"},{s:[[r,l]],b:1,c:e=>0<e.d,g:"val,imp,null,jsonic"},{s:[s],c:e=>0===e.d,p:"list",b:1,g:"list,imp,jsonic"},{s:[s],b:1,g:"list,val,imp,null,jsonic"},{s:[u],g:"jsonic"}],{append:!0,delete:[2]}).close([{s:[[r,l]],b:1,g:"val,json,close",e:(e,t)=>0===e.d?t.t0:void 0},{s:[s],c:e=>e.lte("dlist")&&e.lte("dmap"),r:"list",u:{implist:!0},g:"list,val,imp,comma,jsonic"},{c:e=>e.lte("dlist")&&e.lte("dmap"),r:"list",u:{implist:!0},g:"list,val,imp,space,jsonic",b:1},{s:[u],g:"jsonic"}],{append:!0,move:[1,-1]})}),e.rule("map",e=>{e.bo(e=>{e.n.dmap=1+(e.n.dmap?e.n.dmap:0)}).open([{s:[n,u],b:1,e:f,g:"end,jsonic"}]).open([{s:[d,o],p:"pair",b:2,g:"pair,list,val,imp,jsonic"}],{append:!0}).close([{s:[r],c:e=>e.lte("pk"),g:"end,json"},{s:[r],b:1,g:"path,jsonic"},{s:[[s,l,...p]],b:1,g:"end,path,jsonic"},{s:[u],e:f,g:"end,jsonic"}],{append:!0,delete:[0]})}),e.rule("list",e=>{e.bo(e=>{e.n.dlist=1+(e.n.dlist?e.n.dlist:0),e.prev.u.implist&&(e.node.push(e.prev.node),e.prev.node=e.node)}).open({c:e=>e.prev.u.implist,p:"elem"}).open([{s:[s],p:"elem",b:1,g:"list,elem,val,imp,jsonic"},{p:"elem",g:"list,elem.jsonic"}],{append:!0}).close([{s:[u],e:f,g:"end,jsonic"}],{append:!0})}),e.rule("pair",(e,t)=>{e.open([{s:[s],g:"map,pair,comma,jsonic"}],{append:!0}).bc((e,t)=>{e.u.pair&&h(e,t)}).close([{s:[r],c:e=>e.lte("pk"),b:1,g:"map,pair,json"},{s:[s,r],c:e=>e.lte("pk"),b:1,g:"map,pair,comma,jsonic"},{s:[s,u],g:"end,jsonic"},{s:[s],c:e=>e.lte("pk"),r:"pair",g:"map,pair,json"},{s:[s],c:e=>e.lte("dmap",1),r:"pair",g:"map,pair,jsonic"},{s:[d],c:e=>e.lte("dmap",1),r:"pair",b:1,g:"map,pair,imp,jsonic"},{s:[[r,s,l,...d]],c:e=>0<e.n.pk,b:1,g:"map,pair,imp,path,jsonic"},{s:[l],e:e=>e.c0,g:"end,jsonic"},{s:[u],e:f,g:"map,pair,json"},{r:"pair",b:1,g:"map,pair,imp,jsonic"}],{append:!0,delete:[0,1]})}),e.rule("elem",(e,t)=>{e.open([{s:[s,s],b:2,u:{done:!0},a:e=>e.node.push(null),g:"list,elem,imp,null,jsonic"},{s:[s],u:{done:!0},a:e=>e.node.push(null),g:"list,elem,imp,null,jsonic"},{s:[d,o],e:t.cfg.list.property?void 0:(e,t)=>t.t0,p:"val",n:{pk:1,dmap:1},u:{done:!0,pair:!0,list:!0},a:m,g:"elem,pair,jsonic"}]).bc((e,t)=>{!0===e.u.pair&&(e.u.prev=e.node[e.u.key],h(e,t))}).close([{s:[s,[l,u]],b:1,g:"list,elem,comma,jsonic"},{s:[s],r:"elem",g:"list,elem,json"},{s:[l],b:1,g:"list,elem,json"},{s:[u],e:f,g:"list,elem,json"},{s:[r],e:e=>e.c0,g:"end,jsonic"},{r:"elem",b:1,g:"list,elem,imp,jsonic"}],{delete:[-1,-2]})})}Object.defineProperty(_,"__esModule",{value:!0}),_.makeJSON=_.grammar=void 0,_.grammar=S,_.makeJSON=function(e){let t=e.make({grammar$:!1,text:{lex:!1},number:{hex:!1,oct:!1,bin:!1,sep:null,exclude:/^00+/},string:{chars:'"',multiChars:"",allowUnknown:!1,escape:{v:null}},comment:{lex:!1},map:{extend:!1},lex:{empty:!1},rule:{finish:!1,include:"json"},result:{fail:[void 0,NaN]},tokenSet:{KEY:["#ST",null,null,null]}});return S(t),t};var E={exports:{}};Object.defineProperty(E.exports,"__esModule",{value:!0}),E.exports.root=E.exports.S=E.exports.EMPTY=E.exports.AFTER=E.exports.BEFORE=E.exports.CLOSE=E.exports.OPEN=E.exports.makeTextMatcher=E.exports.makeNumberMatcher=E.exports.makeCommentMatcher=E.exports.makeStringMatcher=E.exports.makeLineMatcher=E.exports.makeSpaceMatcher=E.exports.makeFixedMatcher=E.exports.makeParser=E.exports.makeLex=E.exports.makeRuleSpec=E.exports.makeRule=E.exports.makePoint=E.exports.makeToken=E.exports.make=E.exports.util=E.exports.JsonicError=E.exports.Jsonic=void 0,Object.defineProperty(E.exports,"OPEN",{enumerable:!0,get:function(){return r.OPEN}}),Object.defineProperty(E.exports,"CLOSE",{enumerable:!0,get:function(){return r.CLOSE}}),Object.defineProperty(E.exports,"BEFORE",{enumerable:!0,get:function(){return r.BEFORE}}),Object.defineProperty(E.exports,"AFTER",{enumerable:!0,get:function(){return r.AFTER}}),Object.defineProperty(E.exports,"EMPTY",{enumerable:!0,get:function(){return r.EMPTY}});const j=t({});Object.defineProperty(E.exports,"JsonicError",{enumerable:!0,get:function(){return j.JsonicError}}),Object.defineProperty(E.exports,"S",{enumerable:!0,get:function(){return j.S}});const O=n({});Object.defineProperty(E.exports,"makePoint",{enumerable:!0,get:function(){return O.makePoint}}),Object.defineProperty(E.exports,"makeToken",{enumerable:!0,get:function(){return O.makeToken}}),Object.defineProperty(E.exports,"makeLex",{enumerable:!0,get:function(){return O.makeLex}}),Object.defineProperty(E.exports,"makeFixedMatcher",{enumerable:!0,get:function(){return O.makeFixedMatcher}}),Object.defineProperty(E.exports,"makeSpaceMatcher",{enumerable:!0,get:function(){return O.makeSpaceMatcher}}),Object.defineProperty(E.exports,"makeLineMatcher",{enumerable:!0,get:function(){return O.makeLineMatcher}}),Object.defineProperty(E.exports,"makeStringMatcher",{enumerable:!0,get:function(){return O.makeStringMatcher}}),Object.defineProperty(E.exports,"makeCommentMatcher",{enumerable:!0,get:function(){return O.makeCommentMatcher}}),Object.defineProperty(E.exports,"makeNumberMatcher",{enumerable:!0,get:function(){return O.makeNumberMatcher}}),Object.defineProperty(E.exports,"makeTextMatcher",{enumerable:!0,get:function(){return O.makeTextMatcher}}),Object.defineProperty(E.exports,"makeRule",{enumerable:!0,get:function(){return v.makeRule}}),Object.defineProperty(E.exports,"makeRuleSpec",{enumerable:!0,get:function(){return v.makeRuleSpec}}),Object.defineProperty(E.exports,"makeParser",{enumerable:!0,get:function(){return v.makeParser}});const I={tokenize:j.tokenize,srcfmt:j.srcfmt,clone:j.clone,charset:j.charset,trimstk:j.trimstk,makelog:j.makelog,badlex:j.badlex,extract:j.extract,errinject:j.errinject,errdesc:j.errdesc,configure:j.configure,parserwrap:j.parserwrap,mesc:j.mesc,escre:j.escre,regexp:j.regexp,prop:j.prop,str:j.str,clean:j.clean,deep:j.deep,omap:j.omap,keys:j.keys,values:j.values,entries:j.entries};function T(e,t){let n=!0;if("jsonic"===e)n=!1;else if("json"===e)return(0,_.makeJSON)(M);e="string"==typeof e?{}:e;let r={parser:null,config:null,plugins:[],sub:{lex:void 0,rule:void 0},mark:Math.random()},l=(0,j.deep)({},t?{...t.options}:!1===(null==e?void 0:e.defaults$)?{}:i.defaults,e||{}),o=function(e,t,n){var r;if(j.S.string===typeof e){let i=o.internal();return((null===(r=s.parser)||void 0===r?void 0:r.start)?(0,j.parserwrap)(s.parser):i.parser).start(e,o,t,n)}return e},s=e=>{if(null!=e&&j.S.object===typeof e){(0,j.deep)(l,e),(0,j.configure)(o,r.config,l);let t=o.internal().parser;r.parser=t.clone(l,r.config)}return{...o.options}},a={token:e=>(0,j.tokenize)(e,r.config,o),tokenSet:e=>(0,j.findTokenSet)(e,r.config),fixed:e=>r.config.fixed.ref[e],options:(0,j.deep)(s,l),config:()=>(0,j.deep)(r.config),parse:o,use:function(e,t){if(j.S.function!==typeof e)throw new Error("Jsonic.use: the first argument must be a function defining a plugin. See https://jsonic.senecajs.org/plugin");const n=e.name.toLowerCase(),r=(0,j.deep)({},e.defaults||{},t||{});o.options({plugin:{[n]:r}});let i=o.options.plugin[n];return o.internal().plugins.push(e),e.options=i,e(o,i)||o},rule:(e,t)=>o.internal().parser.rule(e,t)||o,make:e=>T(e,o),empty:e=>T({defaults$:!1,standard$:!1,grammar$:!1,...e||{}}),id:"Jsonic/"+Date.now()+"/"+(""+Math.random()).substring(2,8).padEnd(6,"0")+(null==s.tag?"":"/"+s.tag),toString:()=>a.id,sub:e=>(e.lex&&(r.sub.lex=r.sub.lex||[],r.sub.lex.push(e.lex)),e.rule&&(r.sub.rule=r.sub.rule||[],r.sub.rule.push(e.rule)),o),util:I};if((0,j.defprop)(a.make,j.S.name,{value:j.S.make}),n?(0,j.assign)(o,a):(0,j.assign)(o,{empty:a.empty,parse:a.parse,sub:a.sub,id:a.id,toString:a.toString}),(0,j.defprop)(o,"internal",{value:()=>r}),t){for(let n in t)void 0===o[n]&&(o[n]=t[n]);o.parent=t;let e=t.internal();r.config=(0,j.deep)({},e.config),(0,j.configure)(o,r.config,l),(0,j.assign)(o.token,r.config.t),r.plugins=[...e.plugins],r.parser=e.parser.clone(l,r.config)}else{let e={...o,...a};r.config=(0,j.configure)(e,void 0,l),r.plugins=[],r.parser=(0,v.makeParser)(l,r.config),!1!==l.grammar$&&(0,_.grammar)(e)}return o}let M;E.exports.util=I,E.exports.make=T,E.exports.root=M;let N=E.exports.root=M=T("jsonic");return E.exports.Jsonic=N,M.Jsonic=M,M.JsonicError=j.JsonicError,M.makeLex=O.makeLex,M.makeParser=v.makeParser,M.makeToken=O.makeToken,M.makePoint=O.makePoint,M.makeRule=v.makeRule,M.makeRuleSpec=v.makeRuleSpec,M.makeFixedMatcher=O.makeFixedMatcher,M.makeSpaceMatcher=O.makeSpaceMatcher,M.makeLineMatcher=O.makeLineMatcher,M.makeStringMatcher=O.makeStringMatcher,M.makeCommentMatcher=O.makeCommentMatcher,M.makeNumberMatcher=O.makeNumberMatcher,M.makeTextMatcher=O.makeTextMatcher,M.OPEN=r.OPEN,M.CLOSE=r.CLOSE,M.BEFORE=r.BEFORE,M.AFTER=r.AFTER,M.EMPTY=r.EMPTY,M.util=I,M.make=T,M.S=j.S,E.exports.default=N,E.exports=N,E.exports}))}).call(this)}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{}),e=e.exports;var t={};Object.defineProperty(t,"__esModule",{value:!0}),t.testing=t.evaluate=t.Expr=void 0;const{omap:n,entries:r,values:i}=e.util,l={};let o=function(e,t){let o=e.token.bind(e),y=e.fixed.bind(e),_=t.op||{};const S=v(o,y,_,"prefix"),E=v(o,y,_,"suffix"),j=v(o,y,_,"infix"),O=v(o,y,_,"ternary"),I=function(e,t,n){return r(n).reduce((n,[r,i])=>{if(i.paren){let o=t(i.osrc)||e("#E"+i.osrc),s=e(o),a=t(i.csrc)||e("#E"+i.csrc),c=e(a);n[o]={name:r+"-paren",osrc:i.osrc,csrc:i.csrc,otkn:s,otin:o,ctkn:c,ctin:a,preval:{active:null!=i.preval&&(null==i.preval.active||i.preval.active),required:null!=i.preval&&null!=i.preval.required&&i.preval.required},use:{},paren:!0,src:i.osrc,left:Number.MIN_SAFE_INTEGER,right:Number.MAX_SAFE_INTEGER,infix:!1,prefix:!1,suffix:!1,ternary:!1,tkn:"",tin:-1,terms:1,token:{},OP_MARK:l}}return n},{})}(o,y,_),T=n(I,([e,t])=>[void 0,void 0,t.ctin,t]);let M=Object.values({...I,...T}).reduce((e,t)=>(e[t.otkn]=t.osrc,e[t.ctkn]=t.csrc,e),{}),N=Object.values({...S,...E,...j,...O}).reduce((e,t)=>(e[t.tkn]=t.src,e),{});e.options({fixed:{token:{...N,...M}},lex:{match:{comment:{order:1e5}}}});const P=i(S).map(e=>e.tin),C=i(j).map(e=>e.tin),R=i(E).map(e=>e.tin),w=i(O).filter(e=>0===e.use.ternary.opI).map(e=>e.tin),A=i(O).filter(e=>1===e.use.ternary.opI).map(e=>e.tin),L=i(I).map(e=>e.otin),Y=i(T).map(e=>e.ctin),F=0<P.length,$=0<C.length,J=0<R.length,U=0<w.length&&0<A.length,K=0<L.length&&0<Y.length,B=e.token.CA,V=e.token.CS,D=e.token.CB,G=e.token.TX,z=e.token.NR,Z=e.token.ST,q=e.token.VL,W=e.token.ZZ,X=[G,z,Z,q];e.rule("val",t=>{U&&A.includes(e.token.CL)&&(t.def.open.find(e=>e.g.includes("pair")).c=e=>!e.n.expr_ternary),t.open([F?{s:[P],b:1,n:{expr_prefix:1,expr_suffix:0},p:"expr",g:"expr,expr-prefix"}:null,K?{s:[L],b:1,p:"paren",c:(e,t)=>{let n=!0;return I[e.o0.tin].preval.required&&(n="val"===e.prev.name&&e.prev.u.paren_preval),n&&1===e.prev.i&&(t.root=()=>e),n},g:"expr,expr-paren"}:null]).close([U?{s:[w],c:e=>!e.n.expr,b:1,r:"ternary",g:"expr,expr-ternary"}:null,$?{s:[C],b:1,n:{expr_prefix:0,expr_suffix:0},r:e=>e.n.expr?"":"expr",g:"expr,expr-infix"}:null,J?{s:[R],b:1,n:{expr_prefix:0,expr_suffix:1},r:e=>e.n.expr?"":"expr",g:"expr,expr-suffix"}:null,K?{s:[Y],c:e=>!!e.n.expr_paren,b:1,g:"expr,expr-paren"}:null,K?{s:[L],b:1,r:"val",c:e=>I[e.c0.tin].preval.active,u:{paren_preval:!0},g:"expr,expr-paren,expr-paren-preval"}:null,U?{s:[A],c:e=>!!e.n.expr_ternary,b:1,g:"expr,expr-ternary"}:null,{s:[B],c:e=>1===e.d&&(1<=e.n.expr||1<=e.n.expr_ternary)||1<=e.n.expr_ternary&&1<=e.n.expr_paren,b:1,g:"expr,list,val,imp,comma,top"},{s:[X],c:e=>1===e.d&&(1<=e.n.expr||1<=e.n.expr_ternary)||1<=e.n.expr_ternary&&1<=e.n.expr_paren,b:1,g:"expr,list,val,imp,space,top"}])}),e.rule("list",e=>{e.bo(!1,e=>{e.prev.u.implist||(e.n.expr=0,e.n.expr_prefix=0,e.n.expr_suffix=0,e.n.expr_paren=0,e.n.expr_ternary=0)}).close([K&&{s:[Y],b:e=>V!==e.c0.tin||e.n.expr_paren?1:0}])}),e.rule("map",e=>{e.bo(!1,(...e)=>{e[0].n.expr=0,e[0].n.expr_prefix=0,e[0].n.expr_suffix=0,e[0].n.expr_paren=0,e[0].n.expr_ternary=0}).close([K&&{s:[Y],b:e=>D!==e.c0.tin||e.n.expr_paren?1:0}])}),e.rule("elem",e=>{e.close([K?{s:[Y],b:1,c:e=>!!e.n.expr_paren,g:"expr,expr-paren,imp,close,list"}:null,K?{s:[L],b:1,r:"elem",g:"expr,expr-paren,imp,open,list"}:null])}),e.rule("pair",e=>{e.close([K?{s:[Y],b:1,c:e=>!!e.n.expr_paren||0<e.n.pk,g:"expr,expr-paren,imp,map"}:null])}),e.rule("expr",e=>{e.open([F?{s:[P],c:e=>!!e.n.expr_prefix,n:{expr:1,dlist:1,dmap:1},p:"val",g:"expr,expr-prefix",a:e=>{const t=a(e.o0,S);e.node=x(e.parent.node)?k(e.parent.node,t):s(e,e.parent,t)}}:null,$?{s:[C],p:"val",n:{expr:1,expr_prefix:0,dlist:1,dmap:1},a:e=>{const t=e.prev,n=e.parent,r=a(e.o0,j);x(n.node)&&!g("ternary",n.node)?e.node=k(n.node,r):x(t.node)?(e.node=k(t.node,r),e.parent=t):e.node=s(e,t,r)},g:"expr,expr-infix"}:null,J?{s:[R],n:{expr:1,expr_prefix:0,dlist:1,dmap:1},a:e=>{const t=e.prev,n=a(e.o0,E);e.node=x(t.node)?k(t.node,n):s(e,t,n)},g:"expr,expr-suffix"}:null]).bc(e=>{var t;x(e.node)&&(null===(t=e.node)||void 0===t?void 0:t.length)-1<e.node[0].terms&&e.node.push(e.child.node)}).close([$?{s:[C],c:e=>!e.n.expr_prefix,b:1,r:"expr",g:"expr,expr-infix"}:null,J?{s:[R],c:e=>!e.n.expr_prefix,b:1,r:"expr",g:"expr,expr-suffix"}:null,K?{s:[Y],c:e=>!!e.n.expr_paren,b:1}:null,U?{s:[w],c:e=>!e.n.expr_prefix,b:1,r:"ternary",g:"expr,expr-ternary"}:null,{s:[B],c:e=>e.d<=0,n:{expr:0},r:"elem",a:e=>e.parent.node=e.node=[e.node],g:"expr,comma,list,top"},{s:[X],c:e=>e.d<=0,n:{expr:0},b:1,r:"elem",a:e=>e.parent.node=e.node=[e.node],g:"expr,space,list,top"},{s:[B],c:e=>e.lte("pk"),n:{expr:0},b:1,h:f,g:"expr,list,val,imp,comma"},{c:e=>e.lte("pk")&&e.lte("expr_suffix"),n:{expr:0},h:f,g:"expr,list,val,imp,space"},{n:{expr:0},g:"expr,expr-end"}]).ac(e=>{t.evaluate&&0===e.n.expr&&(e.parent.node=b(e.parent,e.parent.node,t.evaluate))})}),e.rule("paren",e=>{e.bo(e=>{e.n.dmap=0,e.n.dlist=0,e.n.pk=0}).open([K?{s:[L,Y],b:1,g:"expr,expr-paren,empty",c:e=>I[e.o0.tin].name===T[e.o1.tin].name,a:p(I)}:null,K?{s:[L],p:"val",n:{expr_paren:1,expr:0,expr_prefix:0,expr_suffix:0},g:"expr,expr-paren,open",a:p(I)}:null]).close([K?{s:[Y],c:e=>{let t="expr_paren_depth_"+T[e.c0.tin].name;return!!e.n[t]},a:d(T),g:"expr,expr-paren,close"}:null])}),U&&e.rule("ternary",e=>{e.open([{s:[w],p:"val",n:{expr_ternary:1,expr:0,expr_prefix:0,expr_suffix:0},u:{expr_ternary_step:1},g:"expr,expr-ternary,open",a:e=>{let t=a(e.o0,O);e.u.expr_ternary_name=t.name,x(e.prev.node)?e.node=c(e.prev.node,t,u(e.prev.node)):e.node=e.prev.node=c([],t,e.prev.node),e.u.expr_ternary_paren=e.n.expr_paren||e.prev.u.expr_ternary_paren||0,e.n.expr_paren=0}},{p:"val",c:e=>2===e.prev.u.expr_ternary_step,a:e=>{e.u.expr_ternary_step=e.prev.u.expr_ternary_step,e.n.expr_paren=e.u.expr_ternary_paren=e.prev.u.expr_ternary_paren},g:"expr,expr-ternary,step"}]).close([{s:[A],c:e=>1===e.u.expr_ternary_step&&e.u.expr_ternary_name===O[e.c0.tin].name,r:"ternary",a:e=>{e.u.expr_ternary_step++,e.node.push(e.child.node)},g:"expr,expr-ternary,step"},{s:[[B,...Y]],c:m,b:(e,t)=>Y.includes(t.t0.tin)?1:0,r:(e,t)=>{var n;return Y.includes(t.t0.tin)||0!==e.d&&(!e.prev.u.expr_ternary_paren||(null===(n=e.parent.node)||void 0===n?void 0:n.length))?"":"elem"},a:h,g:"expr,expr-ternary,list,val,imp,comma"},{c:m,r:(e,t)=>{var n;return 0!==e.d&&Y.includes(t.t0.tin)&&!e.prev.u.expr_ternary_paren||(null===(n=e.parent.node)||void 0===n?void 0:n.length)||W===t.t0.tin?"":"elem"},a:h,g:"expr,expr-ternary,list,val,imp,space"},{c:e=>0<e.d&&2===e.u.expr_ternary_step,a:e=>{e.node.push(e.child.node)},g:"expr,expr-ternary,close"}])})};function s(e,t,n){let r=t.node;return x(t.node)?r=u(t.node):t.node=[],c(t.node,n),n.prefix||(t.node[1]=r),e.parent=t,t.node}function a(e,t){return{...t[e.tin],token:e,OP_MARK:l}}function c(e,t,...n){let r=e;r[0]=t;let i=0;for(;i<n.length;i++)r[i+1]=n[i];return r.length=i+1,r}function u(e){return[...e]}function p(e){return function(t){let n="expr_paren_depth_"+a(t.o0,e).name;t.u[n]=t.n[n]=1,t.node=void 0}}function d(e){return function(t){(x(t.child.node)||void 0===t.node)&&(t.node=t.child.node);const n=a(t.c0,e);let r="expr_paren_depth_"+n.name;if(t.u[r]===t.n[r]){const e=t.node;t.node=[n],void 0!==e&&(t.node[1]=e),t.parent.prev.u.paren_preval&&(g("paren",t.parent.prev.node)?t.node=c(t.parent.prev.node,t.node[0],u(t.parent.prev.node),t.node[1]):(t.node.splice(1,0,t.parent.prev.node),t.parent.prev.node=t.node))}}}function f(e,t,n){let r=null;for(let i=t.rsI-1;-1<i;i--)if("paren"===t.rs[i].name){r=t.rs[i];break}return r&&(null==r.child.node?(r.child.node=[e.node],n.r="elem",n.b=0):x(r.child.node)&&(r.child.node=[r.child.node],n.r="elem",n.b=0),e.node=r.child.node),n}function m(e){return(0===e.d||1<=e.n.expr_paren)&&!e.n.pk&&2===e.u.expr_ternary_step}function h(e,t,n){e.n.expr_paren=e.prev.u.expr_ternary_paren,e.node.push(e.child.node),"elem"===n.r&&(e.node[0]=u(e.node),e.node.length=1)}function g(e,t){return null!=t&&x(t)&&!0===t[0][e]}function x(e){return null!=e&&e[0]&&e[0].OP_MARK===l}function v(e,t,n,r){return Object.entries(n).filter(([e,t])=>t[r]).reduce((n,[i,o])=>{let s="",a=-1,c="";c="string"==typeof o.src?o.src:o.src[0],a=t(c)||e("#E"+c),s=e(a);let u=n[a]={src:c,left:o.left||Number.MIN_SAFE_INTEGER,right:o.right||Number.MAX_SAFE_INTEGER,name:i+(i.endsWith("-"+r)?"":"-"+r),infix:"infix"===r,prefix:"prefix"===r,suffix:"suffix"===r,ternary:"ternary"===r,tkn:s,tin:a,terms:"ternary"===r?3:"infix"===r?2:1,use:{},paren:!1,osrc:"",csrc:"",otkn:"",ctkn:"",otin:-1,ctin:-1,preval:{active:!1,required:!1},token:{},OP_MARK:l};if(u.ternary){let r=o.src;u.src=r[0],u.use.ternary={opI:0};let i={...u};c=o.src[1],a=t(c)||e("#E"+c),s=e(a),i.src=c,i.use={ternary:{opI:1}},i.tkn=s,i.tin=a,n[a]=i}return n},{})}function k(e,t){let n=e,r=e[0];if(t)if(t.infix)if(r.suffix||t.left<=r.right)c(e,t,u(e));else{const i=r.terms;n=x(e[i])&&e[i][0].right<t.left?k(e[i],t):e[i]=c([],t,e[i])}else if(t.prefix)n=e[r.terms]=c([],t);else if(t.suffix)if(!r.suffix&&r.right<=t.left){const n=r.terms;x(e[n])&&e[n][0].prefix&&e[n][0].right<t.left?k(e[n],t):e[n]=c([],t,e[n])}else c(e,t,u(e));return n}function b(e,t,n){return null==t?t:x(t)?n(e,t[0],t.slice(1).map(t=>b(e,t,n))):t}t.Expr=o,o.defaults={op:{positive:{prefix:!0,right:14e3,src:"+"},negative:{prefix:!0,right:14e3,src:"-"},addition:{infix:!0,left:140,right:150,src:"+"},subtraction:{infix:!0,left:140,right:150,src:"-"},multiplication:{infix:!0,left:160,right:170,src:"*"},division:{infix:!0,left:160,right:170,src:"/"},remainder:{infix:!0,left:160,right:170,src:"%"},plain:{paren:!0,osrc:"(",csrc:")"}}},t.evaluate=b;const y={prattify:k,opify:e=>(e.OP_MARK=l,e)};return t.testing=y,t}));
}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],29:[function(require,module,exports){
"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Debug = void 0;
const jsonic_1 = require("./jsonic");
const { entries, tokenize } = jsonic_1.util;
const Debug = (jsonic, options) => {
    const { keys, values, entries } = jsonic.util;
    jsonic.debug = {
        describe: function () {
            let cfg = jsonic.internal().config;
            let match = cfg.lex.match;
            let rules = jsonic.rule();
            return [
                '========= TOKENS ========',
                Object.entries(cfg.t)
                    .filter((te) => 'string' === typeof te[1])
                    .map((te) => {
                    return ('  ' +
                        te[0] +
                        '\t' +
                        te[1] +
                        '\t' +
                        ((s) => (s ? '"' + s + '"' : ''))(cfg.fixed.ref[te[0]] || ''));
                })
                    .join('\n'),
                '\n',
                '========= RULES =========',
                ruleTree(jsonic, keys(rules), rules),
                '\n',
                '========= ALTS =========',
                values(rules)
                    .map((rs) => '  ' +
                    rs.name +
                    ':\n' +
                    descAlt(jsonic, rs, 'open') +
                    descAlt(jsonic, rs, 'close'))
                    .join('\n\n'),
                '\n',
                '========= LEXER =========',
                '  ' +
                    ((match &&
                        match.map((m) => m.order + ': ' + m.matcher + ' (' + m.make.name + ')')) ||
                        []).join('\n  '),
                '\n',
                '\n',
                '========= PLUGIN =========',
                '  ' +
                    jsonic
                        .internal()
                        .plugins.map((p) => p.name +
                        (p.options
                            ? entries(p.options).reduce((s, e) => (s += '\n    ' + e[0] + ': ' + JSON.stringify(e[1])), '')
                            : ''))
                        .join('\n  '),
                '\n',
            ].join('\n');
        },
    };
    const origUse = jsonic.use.bind(jsonic);
    jsonic.use = (...args) => {
        let self = origUse(...args);
        if (options.print) {
            self
                .internal()
                .config.debug.get_console()
                .log('USE:', args[0].name, '\n\n', self.debug.describe());
        }
        return self;
    };
    if (options.trace) {
        jsonic.options({
            parse: {
                prepare: {
                    debug: (_jsonic, ctx, _meta) => {
                        ctx.log =
                            ctx.log ||
                                ((kind, ...rest) => {
                                    if (LOGKIND[kind]) {
                                        // console.log('LOGKIND', kind, rest[0])
                                        ctx.cfg.debug.get_console().log(LOGKIND[kind](...rest)
                                            .filter((item) => 'object' != typeof item)
                                            .map((item) => 'function' == typeof item ? item.name : item)
                                            .join('  '));
                                    }
                                });
                    },
                },
            },
        });
    }
};
exports.Debug = Debug;
function descAlt(jsonic, rs, kind) {
    const { entries } = jsonic.util;
    return 0 === rs.def[kind].length
        ? ''
        : '    ' +
            kind.toUpperCase() +
            ':\n' +
            rs.def[kind]
                .map((a, i) => {
                var _a, _b;
                return '      ' +
                    ('' + i).padStart(5, ' ') +
                    ' ' +
                    ('[' +
                        (a.s || [])
                            .map((tin) => null == tin
                            ? '***INVALID***'
                            : 'number' === typeof tin
                                ? jsonic.token[tin]
                                : '[' + tin.map((t) => jsonic.token[t]) + ']')
                            .join(' ') +
                        '] ').padEnd(32, ' ') +
                    (a.r ? ' r=' + ('string' === typeof a.r ? a.r : '<F>') : '') +
                    (a.p ? ' p=' + ('string' === typeof a.p ? a.p : '<F>') : '') +
                    (!a.r && !a.p ? '\t' : '') +
                    '\t' +
                    (null == a.b ? '' : 'b=' + a.b) +
                    '\t' +
                    (null == a.n
                        ? ''
                        : 'n=' +
                            entries(a.n).map(([k, v]) => k + ':' + v)) +
                    '\t' +
                    (null == a.a ? '' : 'A') +
                    (null == a.c ? '' : 'C') +
                    (null == a.h ? '' : 'H') +
                    '\t' +
                    (null == ((_a = a.c) === null || _a === void 0 ? void 0 : _a.n)
                        ? '\t'
                        : ' CN=' +
                            entries(a.c.n).map(([k, v]) => k + ':' + v)) +
                    (null == ((_b = a.c) === null || _b === void 0 ? void 0 : _b.d) ? '' : ' CD=' + a.c.d) +
                    (a.g ? '\tg=' + a.g : '');
            })
                .join('\n') +
            '\n';
}
function ruleTree(jsonic, rn, rsm) {
    const { values, omap } = jsonic.util;
    return rn.reduce((a, n) => ((a +=
        '  ' +
            n +
            ':\n    ' +
            values(omap({
                op: ruleTreeStep(rsm, n, 'open', 'p'),
                or: ruleTreeStep(rsm, n, 'open', 'r'),
                cp: ruleTreeStep(rsm, n, 'close', 'p'),
                cr: ruleTreeStep(rsm, n, 'close', 'r'),
            }, ([n, d]) => [
                1 < d.length ? n : undefined,
                n + ': ' + d,
            ])).join('\n    ') +
            '\n'),
        a), '');
}
function ruleTreeStep(rsm, name, state, step) {
    return [
        ...new Set(rsm[name].def[state]
            .filter((alt) => alt[step])
            .map((alt) => alt[step])
            .map((step) => ('string' === typeof step ? step : '<F>'))),
    ].join(' ');
}
function descTokenState(ctx) {
    return ('[' +
        (ctx.NOTOKEN === ctx.t0 ? '' : ctx.F(ctx.t0.src)) +
        (ctx.NOTOKEN === ctx.t1 ? '' : ' ' + ctx.F(ctx.t1.src)) +
        ']~[' +
        (ctx.NOTOKEN === ctx.t0 ? '' : tokenize(ctx.t0.tin, ctx.cfg)) +
        (ctx.NOTOKEN === ctx.t1 ? '' : ' ' + tokenize(ctx.t1.tin, ctx.cfg)) +
        ']');
}
function descParseState(ctx, rule, lex) {
    return (ctx.F(ctx.src().substring(lex.pnt.sI, lex.pnt.sI + 16)).padEnd(18, ' ') +
        ' ' +
        descTokenState(ctx).padEnd(34, ' ') +
        ' ' +
        ('' + rule.d).padStart(4, ' '));
}
function descRuleState(ctx, rule) {
    let en = entries(rule.n);
    let eu = entries(rule.u);
    let ek = entries(rule.k);
    return ('' +
        (0 === en.length
            ? ''
            : ' N<' +
                en
                    .filter((n) => n[1])
                    .map((n) => n[0] + '=' + n[1])
                    .join(';') +
                '>') +
        (0 === eu.length
            ? ''
            : ' U<' + eu.map((u) => u[0] + '=' + ctx.F(u[1])).join(';') + '>') +
        (0 === ek.length
            ? ''
            : ' K<' + ek.map((k) => k[0] + '=' + ctx.F(k[1])).join(';') + '>'));
}
function descAltSeq(alt, cfg) {
    return ('[' +
        (alt.s || [])
            .map((tin) => 'number' === typeof tin
            ? tokenize(tin, cfg)
            : Array.isArray(tin)
                ? '[' + tin.map((t) => tokenize(t, cfg)) + ']'
                : '')
            .join(' ') +
        '] ');
}
const LOG = {
    RuleState: {
        o: jsonic_1.S.open.toUpperCase(),
        c: jsonic_1.S.close.toUpperCase(),
    },
};
const LOGKIND = {
    '': (...rest) => rest,
    stack: (ctx, rule, lex) => [
        jsonic_1.S.logindent + jsonic_1.S.stack,
        descParseState(ctx, rule, lex),
        // S.indent.repeat(Math.max(rule.d + ('o' === rule.state ? -1 : 1), 0)) +
        jsonic_1.S.indent.repeat(rule.d) +
            '/' +
            ctx.rs
                // .slice(0, ctx.rsI)
                .slice(0, rule.d)
                .map((r) => r.name + '~' + r.i)
                .join('/'),
        '~',
        '/' +
            ctx.rs
                // .slice(0, ctx.rsI)
                .slice(0, rule.d)
                .map((r) => ctx.F(r.node))
                .join('/'),
        // 'd=' + rule.d,
        //'rsI=' + ctx.rsI,
        ctx,
        rule,
        lex,
    ],
    rule: (ctx, rule, lex) => [
        rule,
        ctx,
        lex,
        jsonic_1.S.logindent + jsonic_1.S.rule + jsonic_1.S.space,
        descParseState(ctx, rule, lex),
        jsonic_1.S.indent.repeat(rule.d) +
            (rule.name + '~' + rule.i + jsonic_1.S.colon + LOG.RuleState[rule.state]).padEnd(16),
        ('prev=' +
            rule.prev.i +
            ' parent=' +
            rule.parent.i +
            ' child=' +
            rule.child.i).padEnd(28),
        descRuleState(ctx, rule),
    ],
    node: (ctx, rule, lex, next) => [
        rule,
        ctx,
        lex,
        next,
        jsonic_1.S.logindent + jsonic_1.S.node + jsonic_1.S.space,
        descParseState(ctx, rule, lex),
        jsonic_1.S.indent.repeat(rule.d) +
            ('why=' + next.why + jsonic_1.S.space + '<' + ctx.F(rule.node) + '>').padEnd(46),
        descRuleState(ctx, rule),
    ],
    parse: (ctx, rule, lex, match, cond, altI, alt, out) => {
        let ns = match && out.n ? entries(out.n) : null;
        let us = match && out.u ? entries(out.u) : null;
        let ks = match && out.k ? entries(out.k) : null;
        return [
            ctx,
            rule,
            lex,
            jsonic_1.S.logindent + jsonic_1.S.parse,
            descParseState(ctx, rule, lex),
            jsonic_1.S.indent.repeat(rule.d) + (match ? 'alt=' + altI : 'no-alt'),
            match && alt ? descAltSeq(alt, ctx.cfg) : '',
            match && out.g ? 'g:' + out.g + ' ' : '',
            (match && out.p ? 'p:' + out.p + ' ' : '') +
                (match && out.r ? 'r:' + out.r + ' ' : '') +
                (match && out.b ? 'b:' + out.b + ' ' : ''),
            alt && alt.c ? 'c:' + cond : jsonic_1.EMPTY,
            null == ns ? '' : 'n:' + ns.map((p) => p[0] + '=' + p[1]).join(';'),
            null == us ? '' : 'u:' + us.map((p) => p[0] + '=' + p[1]).join(';'),
            null == ks ? '' : 'k:' + ks.map((p) => p[0] + '=' + p[1]).join(';'),
        ];
    },
    lex: (ctx, rule, lex, pnt, sI, match, tkn, alt, altI, tI) => [
        jsonic_1.S.logindent + jsonic_1.S.lex + jsonic_1.S.space + jsonic_1.S.space,
        descParseState(ctx, rule, lex),
        jsonic_1.S.indent.repeat(rule.d) +
            // S.indent.repeat(rule.d) + S.lex, // Log entry prefix.
            // Name of token from tin (token identification numer).
            tokenize(tkn.tin, ctx.cfg),
        ctx.F(tkn.src),
        pnt.sI,
        pnt.rI + ':' + pnt.cI,
        (match === null || match === void 0 ? void 0 : match.name) || '',
        alt
            ? 'on:alt=' +
                altI +
                ';' +
                alt.g +
                ';t=' +
                tI +
                ';' +
                descAltSeq(alt, ctx.cfg)
            : '',
        ctx.F(lex.src.substring(sI, sI + 16)),
        ctx,
        rule,
        lex,
    ],
};
Debug.defaults = {
    print: true,
    trace: false,
};

},{"./jsonic":30}],30:[function(require,module,exports){
(function (global){(function (){
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{("undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this).Jsonic=e()}}((function(){var e=function(e){var t;return function(n){return t||e(t={exports:{},parent:n},t.exports),t.exports}},t=e((function(e,t){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.modlist=t.findTokenSet=t.values=t.keys=t.omap=t.str=t.prop=t.parserwrap=t.trimstk=t.tokenize=t.srcfmt=t.snip=t.regexp=t.mesc=t.makelog=t.isarr=t.filterRules=t.extract=t.escre=t.errinject=t.errdesc=t.entries=t.defprop=t.deep=t.configure=t.clone=t.clean=t.charset=t.badlex=t.assign=t.S=t.JsonicError=void 0;const l=n({}),i=e=>null==e?[]:Object.keys(e);t.keys=i;const s=e=>null==e?[]:Object.values(e);t.values=s;const o=e=>null==e?[]:Object.entries(e);t.entries=o;const a=(e,...t)=>Object.assign(null==e?{}:e,...t);t.assign=a,t.isarr=e=>Array.isArray(e);const c=Object.defineProperty;t.defprop=c;const u=(e,t)=>Object.entries(e||{}).reduce((e,n)=>{let r=t?t(n):n;void 0===r[0]?delete e[n[0]]:e[r[0]]=r[1];let l=2;for(;void 0!==r[l];)e[r[l]]=r[l+1],l+=2;return e},{});t.omap=u;const d={indent:". ",logindent:"  ",space:" ",gap:"  ",Object:"Object",Array:"Array",object:"object",string:"string",function:"function",unexpected:"unexpected",map:"map",list:"list",elem:"elem",pair:"pair",val:"val",node:"node",no_re_flags:r.EMPTY,unprintable:"unprintable",invalid_ascii:"invalid_ascii",invalid_unicode:"invalid_unicode",invalid_lex_state:"invalid_lex_state",unterminated_string:"unterminated_string",unterminated_comment:"unterminated_comment",lex:"lex",parse:"parse",error:"error",none:"none",imp_map:"imp,map",imp_list:"imp,list",imp_null:"imp,null",end:"end",open:"open",close:"close",rule:"rule",stack:"stack",nUll:"null",name:"name",make:"make",colon:":"};t.S=d;class p extends SyntaxError{constructor(e,t,n,r,l){let i=x(e,t=g({},t),n,r,l);super(i.message),a(this,i),v(this)}toJSON(){return{...this,__error:!0,name:this.name,message:this.message,stack:this.stack}}}function m(e,t,n){let l=t.t,i=l[e];return null==i&&r.STRING===typeof e&&(i=t.tI++,l[i]=e,l[e]=i,l[e.substring(1)]=i,null!=n&&a(n.token,t.t)),i}function h(e,...t){return new RegExp(t.map(e=>e.esc?f(e.toString()):e).join(r.EMPTY),null==e?"":e)}function f(e){return null==e?"":e.replace(/[-\\|\]{}()[^$+*?.!=]/g,"\\$&").replace(/\t/g,"\\t").replace(/\r/g,"\\r").replace(/\n/g,"\\n")}function g(e,...t){let n=d.function===typeof e,r=null!=e&&(d.object===typeof e||n);for(let l of t){let t,i=d.function===typeof l,s=null!=l&&(d.object===typeof l||i);if(r&&s&&!i&&Array.isArray(e)===Array.isArray(l))for(let n in l)e[n]=g(e[n],l[n]);else e=void 0===l?e:i?l:s?d.function===typeof(t=l.constructor)&&d.Object!==t.name&&d.Array!==t.name?l:g(Array.isArray(l)?[]:{},l):l,n=d.function===typeof e,r=null!=e&&(d.object===typeof e||n)}return e}function k(e,t,n,r,l,i){let s={code:t,details:n,token:r,rule:l,ctx:i};return null==e?"":e.replace(/\$(\{?)([\w_0-9]+)(\}?)/g,(e,t,o,a)=>{let c=null!=s[o]?s[o]:null!=n[o]?n[o]:i.meta&&null!=i.meta[o]?i.meta[o]:null!=r[o]?r[o]:null!=l[o]?l[o]:null!=i.opts[o]?i.opts[o]:null!=i.cfg[o]?i.cfg[o]:null!=i[o]?i[o]:"$"+o,u=t&&a?c:JSON.stringify(c);return u=null==u?"":u,u.replace(/\n/g,"\n  ")})}function v(e){e.stack&&(e.stack=e.stack.split("\n").filter(e=>!e.includes("jsonic/jsonic")).map(e=>e.replace(/    at /,"at ")).join("\n"))}function b(e,t,n){let l=0<n.sI?n.sI:0,i=0<n.rI?n.rI:1,s=0<n.cI?n.cI:1,o=null==n.src?r.EMPTY:n.src,a=e.substring(Math.max(0,l-333),l).split("\n"),c=e.substring(l,l+333).split("\n"),u=2+(r.EMPTY+(i+2)).length,d=i<3?1:i-2,p=e=>"\x1b[34m"+(r.EMPTY+d++).padStart(u," ")+" | \x1b[0m"+(null==e?r.EMPTY:e),m=a.length;return[2<m?p(a[m-3]):null,1<m?p(a[m-2]):null,p(a[m-1]+c[0])," ".repeat(u)+"   "+" ".repeat(s-1)+"\x1b[31m"+"^".repeat(o.length||1)+" "+t+"\x1b[0m",p(c[1]),p(c[2])].filter(e=>null!=e).join("\n")}function x(e,t,n,r,l){var i,s,o;try{let a=l.cfg,c=l.meta,u=k(a.error[e]||(null===(i=null==t?void 0:t.use)||void 0===i?void 0:i.err)&&(t.use.err.code||t.use.err.message)||a.error.unknown,e,t,n,r,l);d.function===typeof a.hint&&(a.hint={...a.hint(),...a.hint});let p=["\x1b[31m[jsonic/"+e+"]:\x1b[0m "+u,"  \x1b[34m--\x3e\x1b[0m "+(c&&c.fileName||"<no-file>")+":"+n.rI+":"+n.cI,b(l.src(),u,n),"",k((a.hint[e]||(null===(o=null===(s=t.use)||void 0===s?void 0:s.err)||void 0===o?void 0:o.message)||a.hint.unknown||"").trim().split("\n").map(e=>"  "+e).join("\n"),e,t,n,r,l),"","  \x1b[2mhttps://jsonic.senecajs.org\x1b[0m","  \x1b[2m--internal: rule="+r.name+"~"+r.state+"; token="+m(n.tin,l.cfg)+(null==n.why?"":"~"+n.why)+"; plugins="+l.plgn().map(e=>e.name).join(",")+"--\x1b[0m\n"].join("\n"),h={internal:{token:n,ctx:l}};return h={...Object.create(h),message:p,code:e,details:t,meta:c,fileName:c?c.fileName:void 0,lineNumber:n.rI,columnNumber:n.cI},h}catch(a){return console.log(a),{}}}function y(e){return"function"==typeof e.debug.print.src?e.debug.print.src:t=>{let n=null==t?r.EMPTY:Array.isArray(t)?JSON.stringify(t).replace(/]$/,o(t).filter(e=>isNaN(e[0])).map((e,t)=>(0===t?", ":"")+e[0]+": "+JSON.stringify(e[1]))+"]"):JSON.stringify(t);return n=n.substring(0,e.debug.maxlen)+(e.debug.maxlen<n.length?"...":r.EMPTY),n}}function S(e,t=44){let n;try{n="object"==typeof e?JSON.stringify(e):""+e}catch(r){n=""+e}return j(t<n.length?n.substring(0,t-3)+"...":n,t)}function j(e,t=5){return void 0===e?"":(""+e).substring(0,t).replace(/[\r\n\t]/g,".")}function E(...e){return null==e?{}:e.filter(e=>!1!==e).map(e=>"object"==typeof e?i(e).join(r.EMPTY):e).join(r.EMPTY).split(r.EMPTY).reduce((e,t)=>(e[t]=t.charCodeAt(0),e),{})}function O(e){for(let t in e)null==e[t]&&delete e[t];return e}t.JsonicError=p,t.configure=function(e,t,n){var r,l,c,d,p,g,k,v,b,x,y,S,j,I,T,M,N,P,C,w,R,_,A,L,Y,$,F,U,J,B,K,V,D,z,G,Z,W,q,H,X,Q,ee,te,ne,re,le,ie,se,oe,ae;const ce=t||{};ce.t=ce.t||{},ce.tI=ce.tI||1;const ue=e=>m(e,ce);!1!==n.standard$&&(ue("#BD"),ue("#ZZ"),ue("#UK"),ue("#AA"),ue("#SP"),ue("#LN"),ue("#CM"),ue("#NR"),ue("#ST"),ue("#TX"),ue("#VL")),ce.safe={key:!1!==(null===(r=n.safe)||void 0===r?void 0:r.key)},ce.fixed={lex:!!(null===(l=n.fixed)||void 0===l?void 0:l.lex),token:n.fixed?u(O(n.fixed.token),([e,t])=>[t,m(e,ce)]):{},ref:void 0,check:null===(c=n.fixed)||void 0===c?void 0:c.check},ce.fixed.ref=u(ce.fixed.token,([e,t])=>[e,t]),ce.fixed.ref=Object.assign(ce.fixed.ref,u(ce.fixed.ref,([e,t])=>[t,e])),ce.match={lex:!!(null===(d=n.match)||void 0===d?void 0:d.lex),value:n.match?u(O(n.match.value),([e,t])=>[e,t]):{},token:n.match?u(O(n.match.token),([e,t])=>[m(e,ce),t]):{},check:null===(p=n.match)||void 0===p?void 0:p.check},u(ce.match.token,([e,t])=>[e,(t.tin$=+e,t)]);const de=n.tokenSet?Object.keys(n.tokenSet).reduce((e,t)=>(e[t]=n.tokenSet[t].filter(e=>null!=e).map(e=>ue(e)),e),{}):{};ce.tokenSet=ce.tokenSet||{},o(de).map(e=>{let t=e[0],n=e[1];ce.tokenSet[t]?(ce.tokenSet[t].length=0,ce.tokenSet[t].push(...n)):ce.tokenSet[t]=n}),ce.tokenSetTins=o(ce.tokenSet).reduce((e,t)=>(e[t[0]]=e[t[0]]||{},t[1].map(n=>e[t[0]][n]=!0),e),{}),ce.tokenSetTins.IGNORE=ce.tokenSetTins.IGNORE||{},ce.space={lex:!!(null===(g=n.space)||void 0===g?void 0:g.lex),chars:E(null===(k=n.space)||void 0===k?void 0:k.chars),check:null===(v=n.space)||void 0===v?void 0:v.check},ce.line={lex:!!(null===(b=n.line)||void 0===b?void 0:b.lex),chars:E(null===(x=n.line)||void 0===x?void 0:x.chars),rowChars:E(null===(y=n.line)||void 0===y?void 0:y.rowChars),single:!!(null===(S=n.line)||void 0===S?void 0:S.single),check:null===(j=n.line)||void 0===j?void 0:j.check},ce.text={lex:!!(null===(I=n.text)||void 0===I?void 0:I.lex),modify:((null===(T=ce.text)||void 0===T?void 0:T.modify)||[]).concat(([null===(M=n.text)||void 0===M?void 0:M.modify]||[]).flat()).filter(e=>null!=e),check:null===(N=n.text)||void 0===N?void 0:N.check},ce.number={lex:!!(null===(P=n.number)||void 0===P?void 0:P.lex),hex:!!(null===(C=n.number)||void 0===C?void 0:C.hex),oct:!!(null===(w=n.number)||void 0===w?void 0:w.oct),bin:!!(null===(R=n.number)||void 0===R?void 0:R.bin),sep:null!=(null===(_=n.number)||void 0===_?void 0:_.sep)&&""!==n.number.sep,exclude:null===(A=n.number)||void 0===A?void 0:A.exclude,sepChar:null===(L=n.number)||void 0===L?void 0:L.sep,check:null===(Y=n.number)||void 0===Y?void 0:Y.check},ce.value={lex:!!(null===($=n.value)||void 0===$?void 0:$.lex),def:o((null===(F=n.value)||void 0===F?void 0:F.def)||{}).reduce((e,t)=>(null==t[1]||!1===t[1]||t[1].match||(e[t[0]]=t[1]),e),{}),defre:o((null===(U=n.value)||void 0===U?void 0:U.def)||{}).reduce((e,t)=>(t[1]&&t[1].match&&(e[t[0]]=t[1],e[t[0]].consume=!!e[t[0]].consume),e),{})},ce.rule={start:null==(null===(J=n.rule)||void 0===J?void 0:J.start)?"val":n.rule.start,maxmul:null==(null===(B=n.rule)||void 0===B?void 0:B.maxmul)?3:n.rule.maxmul,finish:!!(null===(K=n.rule)||void 0===K?void 0:K.finish),include:(null===(V=n.rule)||void 0===V?void 0:V.include)?n.rule.include.split(/\s*,+\s*/).filter(e=>""!==e):[],exclude:(null===(D=n.rule)||void 0===D?void 0:D.exclude)?n.rule.exclude.split(/\s*,+\s*/).filter(e=>""!==e):[]},ce.map={extend:!!(null===(z=n.map)||void 0===z?void 0:z.extend),merge:null===(G=n.map)||void 0===G?void 0:G.merge},ce.list={property:!!(null===(Z=n.list)||void 0===Z?void 0:Z.property)};let pe=Object.keys(ce.fixed.token).sort((e,t)=>t.length-e.length).map(e=>f(e)).join("|"),me=(null===(W=n.comment)||void 0===W?void 0:W.lex)?(n.comment.def?s(n.comment.def):[]).filter(e=>e&&e.lex).map(e=>f(e.start)).join("|"):"",he=["([",f(i(E(ce.space.lex&&ce.space.chars,ce.line.lex&&ce.line.chars)).join("")),"]",("string"==typeof n.ender?n.ender.split(""):Array.isArray(n.ender)?n.ender:[]).map(e=>"|"+f(e)).join(""),""===pe?"":"|",pe,""===me?"":"|",me,"|$)"];return ce.rePart={fixed:pe,ender:he,commentStart:me},ce.re={ender:h(null,...he),rowChars:h(null,f(null===(q=n.line)||void 0===q?void 0:q.rowChars)),columns:h(null,"["+f(null===(H=n.line)||void 0===H?void 0:H.chars)+"]","(.*)$")},ce.lex={empty:!!(null===(X=n.lex)||void 0===X?void 0:X.empty),emptyResult:null===(Q=n.lex)||void 0===Q?void 0:Q.emptyResult,match:(null===(ee=n.lex)||void 0===ee?void 0:ee.match)?o(n.lex.match).reduce((e,t)=>{let r=t[0],l=t[1];if(l){let t=l.make(ce,n);t&&(t.matcher=r,t.make=l.make,t.order=l.order),e.push(t)}return e},[]).filter(e=>null!=e&&!1!==e&&-1<+e.order).sort((e,t)=>e.order-t.order):[]},ce.parse={prepare:s(null===(te=n.parse)||void 0===te?void 0:te.prepare)},ce.debug={get_console:(null===(ne=n.debug)||void 0===ne?void 0:ne.get_console)||(()=>console),maxlen:null==(null===(re=n.debug)||void 0===re?void 0:re.maxlen)?99:n.debug.maxlen,print:{config:!!(null===(ie=null===(le=n.debug)||void 0===le?void 0:le.print)||void 0===ie?void 0:ie.config),src:null===(oe=null===(se=n.debug)||void 0===se?void 0:se.print)||void 0===oe?void 0:oe.src}},ce.error=n.error||{},ce.hint=n.hint||{},(null===(ae=n.config)||void 0===ae?void 0:ae.modify)&&i(n.config.modify).forEach(e=>n.config.modify[e](ce,n)),ce.debug.print.config&&ce.debug.get_console().dir(ce,{depth:null}),ce.result={fail:[]},n.result&&(ce.result.fail=[...n.result.fail]),a(e.options,n),a(e.token,ce.t),a(e.tokenSet,ce.tokenSet),a(e.fixed,ce.fixed.ref),ce},t.tokenize=m,t.findTokenSet=function(e,t){return t.tokenSet[e]},t.mesc=function(e,t){return(t=new String(e)).esc=!0,t},t.regexp=h,t.escre=f,t.deep=g,t.errinject=k,t.trimstk=v,t.extract=b,t.errdesc=x,t.badlex=function(e,t,n){let r=e.next.bind(e);return e.next=(e,l,i,s)=>{let o=r(e,l,i,s);if(t===o.tin){let t={};throw null!=o.use&&(t.use=o.use),new p(o.why||d.unexpected,t,o,e,n)}return o},e},t.makelog=function(e,t){var n,r,l;let i=null===(l=null===(r=null===(n=e.opts)||void 0===n?void 0:n.plugin)||void 0===r?void 0:r.debug)||void 0===l?void 0:l.trace;if(t||i)if("number"==typeof(null==t?void 0:t.log)||i){let n=!1,r=null==t?void 0:t.log;(-1===r||i)&&(r=1,n=!0),e.log=(...t)=>{if(n){let n=t.filter(e=>d.object!=typeof e).map(e=>d.function==typeof e?e.name:e).join(d.gap);e.cfg.debug.get_console().log(n)}else e.cfg.debug.get_console().dir(t,{depth:r})}}else"function"==typeof t.log&&(e.log=t.log);return e.log},t.srcfmt=y,t.str=S,t.snip=j,t.clone=function(e){return g(Object.create(Object.getPrototypeOf(e)),e)},t.charset=E,t.clean=O,t.filterRules=function(e,t){let n=["open","close"];for(let r of n)e.def[r]=e.def[r].map(e=>(e.g="string"==typeof e.g?(e.g||"").split(/\s*,+\s*/):e.g||[],e)).filter(e=>t.rule.include.reduce((t,n)=>t||null!=e.g&&-1!==e.g.indexOf(n),0===t.rule.include.length)).filter(e=>t.rule.exclude.reduce((t,n)=>t&&(null==e.g||-1===e.g.indexOf(n)),!0));return e},t.prop=function(e,t,n){let r=e;try{let r,l=t.split(".");for(let t=0;t<l.length;t++)r=l[t],t<l.length-1&&(e=e[r]=e[r]||{});return void 0!==n&&(e[r]=n),e[r]}catch(l){throw new Error("Cannot "+(void 0===n?"get":"set")+" path "+t+" on object: "+S(r)+(void 0===n?"":" to value: "+S(n,22)))}},t.modlist=function(e,t){if(t&&e){if(0<e.length){if(t.delete&&0<t.delete.length)for(let r=0;r<t.delete.length;r++){let n=t.delete[r];(n<0?-1*n<=e.length:n<e.length)&&(e[(e.length+n)%e.length]=null)}if(t.move)for(let r=0;r<t.move.length;r+=2){let n=(e.length+t.move[r])%e.length,l=(e.length+t.move[r+1])%e.length,i=e[n];e.splice(n,1),e.splice(l,0,i)}let n=e.filter(e=>null!=e);n.length!==e.length&&(e.length=0,e.push(...n))}if(t.custom){let n=t.custom(e);null!=n&&(e=n)}}return e},t.parserwrap=function(e){return{start:function(t,n,i,s){try{return e.start(t,n,i,s)}catch(o){if("SyntaxError"===o.name){let e=0,s=0,a=0,c=r.EMPTY,u=o.message.match(/^Unexpected token (.) .*position\s+(\d+)/i);if(u){c=u[1],e=parseInt(u[2]),s=t.substring(0,e).replace(/[^\n]/g,r.EMPTY).length;let n=e-1;for(;-1<n&&"\n"!==t.charAt(n);)n--;a=Math.max(t.substring(n,e).length,0)}let d=o.token||(0,l.makeToken)("#UK",m("#UK",n.internal().config),void 0,c,(0,l.makePoint)(c.length,e,o.lineNumber||s,o.columnNumber||a));throw new p(o.code||"json",o.details||{msg:o.message},d,{},o.ctx||{uI:-1,opts:n.options,cfg:n.internal().config,token:d,meta:i,src:()=>t,root:()=>{},plgn:()=>n.internal().plugins,inst:()=>n,rule:{name:"no-rule"},sub:{},xs:-1,v2:d,v1:d,t0:d,t1:d,tC:-1,kI:-1,rs:[],rsI:0,rsm:{},n:{},log:i?i.log:void 0,F:y(n.internal().config),u:{},NORULE:{name:"no-rule"},NOTOKEN:{name:"no-token"}})}throw o}}}}})),n=e((function(e,n){"use strict";Object.defineProperty(n,"__esModule",{value:!0}),n.makeTextMatcher=n.makeNumberMatcher=n.makeCommentMatcher=n.makeStringMatcher=n.makeLineMatcher=n.makeSpaceMatcher=n.makeFixedMatcher=n.makeMatchMatcher=n.makeToken=n.makePoint=n.makeLex=n.makeNoToken=void 0;const l=t({});class i{constructor(e,t,n,r){this.len=-1,this.sI=0,this.rI=1,this.cI=1,this.token=[],this.len=e,null!=t&&(this.sI=t),null!=n&&(this.rI=n),null!=r&&(this.cI=r)}toString(){return"Point["+[this.sI+"/"+this.len,this.rI,this.cI]+(0<this.token.length?" "+this.token:"")+"]"}[r.INSPECT](){return this.toString()}}const s=(...e)=>new i(...e);n.makePoint=s;class o{constructor(e,t,n,l,i,s,o){this.isToken=!0,this.name=r.EMPTY,this.tin=-1,this.val=void 0,this.src=r.EMPTY,this.sI=-1,this.rI=-1,this.cI=-1,this.len=-1,this.name=e,this.tin=t,this.src=l,this.val=n,this.sI=i.sI,this.rI=i.rI,this.cI=i.cI,this.use=s,this.why=o,this.len=null==l?0:l.length}resolveVal(e,t){return"function"==typeof this.val?this.val(e,t):this.val}bad(e,t){return this.err=e,null!=t&&(this.use=(0,l.deep)(this.use||{},t)),this}toString(){return"Token["+this.name+"="+this.tin+" "+(0,l.snip)(this.src)+(void 0===this.val||"#ST"===this.name||"#TX"===this.name?"":"="+(0,l.snip)(this.val))+" "+[this.sI,this.rI,this.cI]+(null==this.use?"":" "+(0,l.snip)(""+JSON.stringify(this.use).replace(/"/g,""),22))+(null==this.err?"":" "+this.err)+(null==this.why?"":" "+(0,l.snip)(""+this.why,22))+"]"}[r.INSPECT](){return this.toString()}}const a=(...e)=>new o(...e);function c(e,t,n){let r=e.pnt,l=t;if(e.cfg.fixed.lex&&null!=n&&0<n.length){let i,s=e.cfg.fixed.token[n];null!=s&&(i=e.token(s,void 0,n,r)),null!=i&&(r.sI+=i.src.length,r.cI+=i.src.length,null==t?l=i:r.token.push(i))}return l}n.makeToken=a,n.makeNoToken=()=>a("",-1,void 0,r.EMPTY,s(-1)),n.makeFixedMatcher=(e,t)=>{let n=(0,l.regexp)(null,"^(",e.rePart.fixed,")");return function(t){let r=e.fixed;if(!r.lex)return;if(e.fixed.check){let n=e.fixed.check(t);if(n&&n.done)return n.token}let l=t.pnt,i=t.src.substring(l.sI).match(n);if(i){let e=i[1],n=e.length;if(0<n){let i,s=r.token[e];return null!=s&&(i=t.token(s,void 0,e,l),l.sI+=n,l.cI+=n),i}}}},n.makeMatchMatcher=(e,t)=>{let n=(0,l.values)(e.match.value),r=(0,l.values)(e.match.token);return 0===n.length&&0===r.length?null:function(t,l,i=0){if(!e.match.lex)return;if(e.match.check){let n=e.match.check(t);if(n&&n.done)return n.token}let s=t.pnt,o=t.src.substring(s.sI),a="o"===l.state?0:1;for(let e of n)if(e.match instanceof RegExp){let n=o.match(e.match);if(n){let r=n[0],l=r.length;if(0<l){let i,o=e.val?e.val(n):r;return i=t.token("#VL",o,r,s),s.sI+=l,s.cI+=l,i}}}else{let n=e.match(t,l);if(null!=n)return n}for(let e of r)if(!e.tin$||l.spec.def.tcol[a][i].includes(e.tin$))if(e instanceof RegExp){let n=o.match(e);if(n){let r=n[0],l=r.length;if(0<l){let n,i=e.tin$;return n=t.token(i,r,r,s),s.sI+=l,s.cI+=l,n}}}else{let n=e(t,l);if(null!=n)return n}}},n.makeCommentMatcher=(e,t)=>{let n=t.comment;e.comment={lex:!!n&&!!n.lex,def:((null==n?void 0:n.def)?(0,l.entries)(n.def):[]).reduce((e,[t,n])=>{if(null==n||!1===n)return e;let r={name:t,start:n.start,end:n.end,line:!!n.line,lex:!!n.lex,eatline:!!n.eatline};return e[t]=r,e},{})};let r=e.comment.lex?(0,l.values)(e.comment.def).filter(e=>e.lex&&e.line):[],i=e.comment.lex?(0,l.values)(e.comment.def).filter(e=>e.lex&&!e.line):[];return function(t,n){if(!e.comment.lex)return;if(e.comment.check){let n=e.comment.check(t);if(n&&n.done)return n.token}let s=t.pnt,o=t.src.substring(s.sI),a=s.rI,c=s.cI;for(let l of r)if(o.startsWith(l.start)){let n=o.length,r=l.start.length;for(c+=l.start.length;r<n&&!e.line.chars[o[r]];)c++,r++;if(l.eatline)for(;r<n&&e.line.chars[o[r]];)e.line.rowChars[o[r]]&&a++,r++;let i=o.substring(0,r),u=t.token("#CM",void 0,i,s);return s.sI+=i.length,s.cI=c,s.rI=a,u}for(let r of i)if(o.startsWith(r.start)){let n=o.length,i=r.start.length,u=r.end;for(c+=r.start.length;i<n&&!o.substring(i).startsWith(u);)e.line.rowChars[o[i]]&&(a++,c=0),c++,i++;if(o.substring(i).startsWith(u)){if(c+=u.length,r.eatline)for(;i<n&&e.line.chars[o[i]];)e.line.rowChars[o[i]]&&a++,i++;let l=o.substring(0,i+u.length),d=t.token("#CM",void 0,l,s);return s.sI+=l.length,s.rI=a,s.cI=c,d}return t.bad(l.S.unterminated_comment,s.sI,s.sI+9*r.start.length)}}},n.makeTextMatcher=(e,t)=>{let n=(0,l.regexp)(e.line.lex?null:"s","^(.*?)",...e.rePart.ender);return function(r){if(e.text.check){let t=e.text.check(r);if(t&&t.done)return t.token}let l=e.text,i=r.pnt,s=r.src.substring(i.sI),o=e.value.def,a=e.value.defre,u=s.match(n);if(u){let n,d=u[1],p=u[2];if(null!=d){let t=d.length;if(0<t){let c;if(e.value.lex)if(void 0!==(c=o[d]))n=r.token("#VL",c.val,d,i),i.sI+=t,i.cI+=t;else for(let e in a){let t=a[e];if(t.match){let e=t.match.exec(t.consume?s:d);if(e&&(t.consume||e[0].length===d.length)){let l=e[0];if(null==t.val)n=r.token("#VL",l,l,i);else{let s=t.val(e);n=r.token("#VL",s,l,i)}i.sI+=l.length,i.cI+=l.length}}}null==n&&l.lex&&(n=r.token("#TX",d,d,i),i.sI+=t,i.cI+=t)}}if(n&&(n=c(r,n,p)),n&&0<e.text.modify.length){const l=e.text.modify;for(let i=0;i<l.length;i++)n.val=l[i](n.val,r,e,t)}return n}}},n.makeNumberMatcher=(e,t)=>{let n=e.number,r=(0,l.regexp)(null,["^([-+]?(0(",[n.hex?"x[0-9a-fA-F_]+":null,n.oct?"o[0-7_]+":null,n.bin?"b[01_]+":null].filter(e=>null!=e).join("|"),")|\\.?[0-9]+([0-9_]*[0-9])?)","(\\.[0-9]?([0-9_]*[0-9])?)?","([eE][-+]?[0-9]+([0-9_]*[0-9])?)?"].join("").replace(/_/g,n.sep?(0,l.escre)(n.sepChar):""),")",...e.rePart.ender),i=n.sep?(0,l.regexp)("g",(0,l.escre)(n.sepChar)):void 0;return function(t){if(n=e.number,!n.lex)return;if(e.number.check){let n=e.number.check(t);if(n&&n.done)return n.token}let l=t.pnt,s=t.src.substring(l.sI),o=e.value.def,a=s.match(r);if(a){let n,r=a[1],s=a[9],u=!0;if(null!=r&&(u=!e.number.exclude||!r.match(e.number.exclude))){let s=r.length;if(0<s){let a;if(e.value.lex&&void 0!==(a=o[r]))n=t.token("#VL",a.val,r,l);else{let e=i?r.replace(i,""):r,o=+e;if(isNaN(o)){let t=e[0];"-"!==t&&"+"!==t||(o=("-"===t?-1:1)*+e.substring(1))}isNaN(o)||(n=t.token("#NR",o,r,l),l.sI+=s,l.cI+=s)}}}return u&&(n=c(t,n,s)),n}}},n.makeStringMatcher=(e,t)=>{let n=t.string||{};return e.string=e.string||{},e.string=(0,l.deep)(e.string,{lex:!!(null==n?void 0:n.lex),quoteMap:(0,l.charset)(n.chars),multiChars:(0,l.charset)(n.multiChars),escMap:{...n.escape},escChar:n.escapeChar,escCharCode:null==n.escapeChar?void 0:n.escapeChar.charCodeAt(0),allowUnknown:!!n.allowUnknown,replaceCodeMap:(0,l.omap)((0,l.clean)({...n.replace}),([e,t])=>[e.charCodeAt(0),t]),hasReplace:!1,abandon:!!n.abandon}),e.string.escMap=(0,l.clean)(e.string.escMap),e.string.hasReplace=0<(0,l.keys)(e.string.replaceCodeMap).length,function(t){let n=e.string;if(!n.lex)return;if(e.string.check){let n=e.string.check(t);if(n&&n.done)return n.token}let{quoteMap:i,escMap:s,escChar:o,escCharCode:a,multiChars:c,allowUnknown:u,replaceCodeMap:d,hasReplace:p}=n,{pnt:m,src:h}=t,{sI:f,rI:g,cI:k}=m,v=h.length;if(i[h[f]]){const i=h[f],b=f,x=g,y=c[i];++f,++k;let S,j=[];for(;f<v;f++){k++;let r=h[f];if(S=void 0,i===r){f++;break}if(o===r){f++,k++;let e=s[h[f]];if(null!=e)j.push(e);else if("x"===h[f]){f++;let e=parseInt(h.substring(f,f+2),16);if(isNaN(e)){if(n.abandon)return;return f-=2,k-=2,m.sI=f,m.cI=k,t.bad(l.S.invalid_ascii,f,f+4)}let r=String.fromCharCode(e);j.push(r),f+=1,k+=2}else if("u"===h[f]){f++;let e="{"===h[f]?(f++,1):0,r=e?6:4,i=parseInt(h.substring(f,f+r),16);if(isNaN(i)){if(n.abandon)return;return f=f-2-e,k-=2,m.sI=f,m.cI=k,t.bad(l.S.invalid_unicode,f,f+r+2+2*e)}let s=String.fromCodePoint(i);j.push(s),f+=r-1+e,k+=r+e}else{if(!u){if(n.abandon)return;return m.sI=f,m.cI=k-1,t.bad(l.S.unexpected,f,f+1)}j.push(h[f])}}else if(p&&void 0!==(S=d[h.charCodeAt(f)]))j.push(S),k++;else{let r=f,s=i.charCodeAt(0),o=h.charCodeAt(f);for(;(!p||void 0===(S=d[o]))&&f<v&&32<=o&&s!==o&&a!==o;)o=h.charCodeAt(++f),k++;if(k--,void 0===S&&o<32){if(!y||!e.line.chars[h[f]]){if(n.abandon)return;return m.sI=f,m.cI=k,t.bad(l.S.unprintable,f,f+1)}e.line.rowChars[h[f]]&&(m.rI=++g),k=1,j.push(h.substring(r,f+1))}else j.push(h.substring(r,f)),f--}}if(h[f-1]!==i||m.sI===f-1){if(n.abandon)return;return m.rI=x,t.bad(l.S.unterminated_string,b,f)}const E=t.token("#ST",j.join(r.EMPTY),h.substring(m.sI,f),m);return m.sI=f,m.rI=g,m.cI=k,E}}},n.makeLineMatcher=(e,t)=>function(t){if(!e.line.lex)return;if(e.line.check){let n=e.line.check(t);if(n&&n.done)return n.token}let n,{chars:r,rowChars:l}=e.line,{pnt:i,src:s}=t,{sI:o,rI:a}=i,c=e.line.single;for(c&&(n={});r[s[o]]&&!(n&&(n[s[o]]=(n[s[o]]||0)+1,c&&1<n[s[o]]));)a+=l[s[o]]?1:0,o++;if(i.sI<o){let e=s.substring(i.sI,o);const n=t.token("#LN",void 0,e,i);return i.sI+=e.length,i.rI=a,i.cI=1,n}},n.makeSpaceMatcher=(e,t)=>function(t){if(!e.space.lex)return;if(e.space.check){let n=e.space.check(t);if(n&&n.done)return n.token}let{chars:n}=e.space,{pnt:r,src:l}=t,{sI:i,cI:s}=r;for(;n[l[i]];)i++,s++;if(r.sI<i){let e=l.substring(r.sI,i);const n=t.token("#SP",void 0,e,r);return r.sI+=e.length,r.cI=s,n}};class u{constructor(e){this.src=r.EMPTY,this.ctx={},this.cfg={},this.pnt=s(-1),this.ctx=e,this.src=e.src(),this.cfg=e.cfg,this.pnt=s(this.src.length)}token(e,t,n,r,i,s){let o,c;return"string"==typeof e?(c=e,o=(0,l.tokenize)(c,this.cfg)):(o=e,c=(0,l.tokenize)(e,this.cfg)),a(c,o,t,n,r||this.pnt,i,s)}next(e,t,n,r){let i,s,o=this.pnt,a=o.sI;if(o.end)i=o.end;else if(0<o.token.length)i=o.token.shift();else if(o.len<=o.sI)o.end=this.token("#ZZ",void 0,"",o),i=o.end;else{try{for(let t of this.cfg.lex.match)if(i=t(this,e,r)){s=t;break}}catch(c){i=i||this.token("#BD",void 0,this.src[o.sI],o,{err:c},c.code||l.S.unexpected)}i=i||this.token("#BD",void 0,this.src[o.sI],o,void 0,l.S.unexpected)}return this.ctx.log&&this.ctx.log(l.S.lex,this.ctx,e,this,o,a,s,i,t,n,r),this.ctx.sub.lex&&this.ctx.sub.lex.map(t=>t(i,e,this.ctx)),i}tokenize(e){return(0,l.tokenize)(e,this.cfg)}bad(e,t,n){return this.token("#BD",void 0,0<=t&&t<=n?this.src.substring(t,n):this.src[this.pnt.sI],void 0,void 0,e)}}n.makeLex=(...e)=>new u(...e)})),r={};Object.defineProperty(r,"__esModule",{value:!0}),r.STRING=r.INSPECT=r.EMPTY=r.AFTER=r.BEFORE=r.CLOSE=r.OPEN=void 0,r.OPEN="o",r.CLOSE="c",r.BEFORE="b",r.AFTER="a",r.EMPTY="",r.INSPECT=Symbol.for("nodejs.util.inspect.custom"),r.STRING="string";var l={};Object.defineProperty(l,"__esModule",{value:!0}),l.defaults=void 0;const i=n({}),s={safe:{key:!0},tag:"-",fixed:{lex:!0,token:{"#OB":"{","#CB":"}","#OS":"[","#CS":"]","#CL":":","#CA":","}},match:{lex:!0,token:{}},tokenSet:{IGNORE:["#SP","#LN","#CM"],VAL:["#TX","#NR","#ST","#VL"],KEY:["#TX","#NR","#ST","#VL"]},space:{lex:!0,chars:" \t"},line:{lex:!0,chars:"\r\n",rowChars:"\n",single:!1},text:{lex:!0},number:{lex:!0,hex:!0,oct:!0,bin:!0,sep:"_",exclude:void 0},comment:{lex:!0,def:{hash:{line:!0,start:"#",lex:!0,eatline:!1},slash:{line:!0,start:"//",lex:!0,eatline:!1},multi:{line:!1,start:"/*",end:"*/",lex:!0,eatline:!1}}},string:{lex:!0,chars:"'\"`",multiChars:"`",escapeChar:"\\",escape:{b:"\b",f:"\f",n:"\n",r:"\r",t:"\t",v:"\v",'"':'"',"'":"'","`":"`","\\":"\\","/":"/"},allowUnknown:!0,abandon:!1},map:{extend:!0,merge:void 0},list:{property:!0},value:{lex:!0,def:{true:{val:!0},false:{val:!1},null:{val:null}}},ender:[],plugin:{},debug:{get_console:()=>console,maxlen:99,print:{config:!1,src:void 0}},error:{unknown:"unknown error: $code",unexpected:"unexpected character(s): $src",invalid_unicode:"invalid unicode escape: $src",invalid_ascii:"invalid ascii escape: $src",unprintable:"unprintable character: $src",unterminated_string:"unterminated string: $src",unterminated_comment:"unterminated comment: $src",unknown_rule:"unknown rule: $rulename"},hint:function(e=((e,t="replace")=>e[t](/[A-Z]/g,e=>" "+e.toLowerCase())[t](/[~%][a-z]/g,e=>("~"==e[0]?" ":"")+e[1].toUpperCase())),t="~sinceTheErrorIsUnknown,ThisIsProbablyABugInsideJsonic\nitself,OrAPlugin.~pleaseConsiderPostingAGithubIssue -Thanks!\n\n~code: $code,~details: \n$details|~theCharacter(s) $srcWereNotExpectedAtThisPointAsTheyDoNot\nmatchTheExpectedSyntax,EvenUnderTheRelaxedJsonicRules.~ifIt\nisNotObviouslyWrong,TheActualSyntaxErrorMayBeElsewhere.~try\ncommentingOutLargerAreasAroundThisPointUntilYouGetNoErrors,\nthenRemoveTheCommentsInSmallSectionsUntilYouFindThe\noffendingSyntax.~n%o%t%e:~alsoCheckIfAnyPluginsYouAreUsing\nexpectDifferentSyntaxInThisCase.|~theEscapeSequence $srcDoesNotEncodeAValidUnicodeCodePoint\nnumber.~youMayNeedToValidateYourStringDataManuallyUsingTest\ncodeToSeeHow~javaScriptWillInterpretIt.~alsoConsiderThatYour\ndataMayHaveBecomeCorrupted,OrTheEscapeSequenceHasNotBeen\ngeneratedCorrectly.|~theEscapeSequence $srcDoesNotEncodeAValid~a%s%c%i%iCharacter.~you\nmayNeedToValidateYourStringDataManuallyUsingTestCodeToSee\nhow~javaScriptWillInterpretIt.~alsoConsiderThatYourDataMay\nhaveBecomeCorrupted,OrTheEscapeSequenceHasNotBeenGenerated\ncorrectly.|~stringValuesCannotContainUnprintableCharacters (characterCodes\nbelow 32).~theCharacter $srcIsUnprintable.~youMayNeedToRemove\ntheseCharactersFromYourSourceData.~alsoCheckThatItHasNot\nbecomeCorrupted.|~thisStringHasNoEndQuote.|~thisCommentIsNeverClosed.|~noRuleNamed $rulenameIsDefined.~thisIsProbablyAnErrorInThe\ngrammarOfAPlugin.".split("|")){return"unknown|unexpected|invalid_unicode|invalid_ascii|unprintable|unterminated_string|unterminated_comment|unknown_rule".split("|").reduce((n,r,l)=>(n[r]=e(t[l]),n),{})},lex:{match:{match:{order:1e6,make:i.makeMatchMatcher},fixed:{order:2e6,make:i.makeFixedMatcher},space:{order:3e6,make:i.makeSpaceMatcher},line:{order:4e6,make:i.makeLineMatcher},string:{order:5e6,make:i.makeStringMatcher},comment:{order:6e6,make:i.makeCommentMatcher},number:{order:7e6,make:i.makeNumberMatcher},text:{order:8e6,make:i.makeTextMatcher}},empty:!0,emptyResult:void 0},parse:{prepare:{}},rule:{start:"val",finish:!0,maxmul:3,include:"",exclude:""},result:{fail:[]},config:{modify:{}},parser:{start:void 0}};l.defaults=s;var o={};Object.defineProperty(o,"__esModule",{value:!0}),o.makeRuleSpec=o.makeNoRule=o.makeRule=void 0;const a=t({});class c{constructor(e,t,n){this.i=-1,this.name=r.EMPTY,this.node=null,this.state=r.OPEN,this.n=Object.create(null),this.d=-1,this.u=Object.create(null),this.k=Object.create(null),this.bo=!1,this.ao=!1,this.bc=!1,this.ac=!1,this.os=0,this.cs=0,this.need=0,this.i=t.uI++,this.name=e.name,this.spec=e,this.child=t.NORULE,this.parent=t.NORULE,this.prev=t.NORULE,this.o0=t.NOTOKEN,this.o1=t.NOTOKEN,this.c0=t.NOTOKEN,this.c1=t.NOTOKEN,this.node=n,this.d=t.rsI,this.bo=null!=e.def.bo,this.ao=null!=e.def.ao,this.bc=null!=e.def.bc,this.ac=null!=e.def.ac}process(e,t){return this.spec.process(this,e,t,this.state)}eq(e,t=0){let n=this.n[e];return null==n||n===t}lt(e,t=0){let n=this.n[e];return null==n||n<t}gt(e,t=0){let n=this.n[e];return null==n||n>t}lte(e,t=0){let n=this.n[e];return null==n||n<=t}gte(e,t=0){let n=this.n[e];return null==n||n>=t}toString(){return"[Rule "+this.name+"~"+this.i+"]"}}const u=(...e)=>new c(...e);o.makeRule=u,o.makeNoRule=e=>u(g(e.cfg,{}),e);class d{constructor(){this.p=r.EMPTY,this.r=r.EMPTY,this.b=0}}const p=(...e)=>new d(...e),m=p(),h=p();class f{constructor(e,t){this.name=r.EMPTY,this.def={open:[],close:[],bo:[],bc:[],ao:[],ac:[],tcol:[]},this.cfg=e,this.def=Object.assign(this.def,t),this.def.open=(this.def.open||[]).filter(e=>null!=e),this.def.close=(this.def.close||[]).filter(e=>null!=e);for(let n of[...this.def.open,...this.def.close])k(n)}tin(e){return(0,a.tokenize)(e,this.cfg)}add(e,t,n){let r=(null==n?void 0:n.append)?"push":"unshift",l=((0,a.isarr)(t)?t:[t]).filter(e=>null!=e&&"object"==typeof e).map(e=>k(e)),i="o"===e?"open":"close",s=this.def[i];return s[r](...l),s=this.def[i]=(0,a.modlist)(s,n),(0,a.filterRules)(this,this.cfg),this.norm(),this}open(e,t){return this.add("o",e,t)}close(e,t){return this.add("c",e,t)}action(e,t,n,r){let l=this.def[t+n];return e?l.push(r):l.unshift(r),this}bo(e,t){return this.action(!t||!!e,r.BEFORE,r.OPEN,t||e)}ao(e,t){return this.action(!t||!!e,r.AFTER,r.OPEN,t||e)}bc(e,t){return this.action(!t||!!e,r.BEFORE,r.CLOSE,t||e)}ac(e,t){return this.action(!t||!!e,r.AFTER,r.CLOSE,t||e)}clear(){return this.def.open.length=0,this.def.close.length=0,this.def.bo.length=0,this.def.ao.length=0,this.def.bc.length=0,this.def.ac.length=0,this}norm(){this.def.open.map(e=>k(e)),this.def.close.map(e=>k(e));const e=[];function t(e,t,n){return n[e]=n[e]||[],[function(e,n){if(n.s&&n.s[t]){let r=[...new Set(e.concat(n.s[t]))];e.length=0,e.push(...r)}return e},n[e][t]=n[e][t]||[]]}return this.def.open.reduce(...t(0,0,e)),this.def.open.reduce(...t(0,1,e)),this.def.close.reduce(...t(1,0,e)),this.def.close.reduce(...t(1,1,e)),this.def.tcol=e,this}process(e,t,n,l){t.log&&t.log(a.S.rule,t,e,n);let i="o"===l,s=i?e:t.NORULE,o=i?"O":"C",c=this.def,d=i?c.open:c.close,p=i?e.bo?c.bo:null:e.bc?c.bc:null;if(p){let n;for(let r=0;r<p.length;r++)if(n=p[r].call(this,e,t,s,n),(null==n?void 0:n.isToken)&&(null==n?void 0:n.err))return this.bad(n,e,t,{is_open:i})}let f=0<d.length?function(e,t,n,l,i){let s=m;s.b=0,s.p=r.EMPTY,s.r=r.EMPTY,s.n=void 0,s.h=void 0,s.a=void 0,s.u=void 0,s.k=void 0,s.e=void 0;let o=null,c=0,u=!0,d=1<<i.cfg.t.AA-1,p=i.cfg.tokenSetTins.IGNORE;function h(e,t,r,l){let s;do{s=n.next(e,t,r,l),i.tC++}while(p[s.tin]);return s}let f=t.length;for(c=0;c<f;c++){o=t[c];let n=!1,r=!1;if(u=!0,o.S0){let e=(i.t0=i.NOTOKEN!==i.t0?i.t0:i.t0=h(l,o,c,0)).tin;if(n=!0,u=!!(o.S0[e/31|0]&(1<<e%31-1|d)),u&&(r=null!=o.S1,o.S1)){let e=(i.t1=i.NOTOKEN!==i.t1?i.t1:i.t1=h(l,o,c,1)).tin;r=!0,u=!!(o.S1[e/31|0]&(1<<e%31-1|d))}}if(e?(l.o0=n?i.t0:i.NOTOKEN,l.o1=r?i.t1:i.NOTOKEN,l.os=(n?1:0)+(r?1:0)):(l.c0=n?i.t0:i.NOTOKEN,l.c1=r?i.t1:i.NOTOKEN,l.cs=(n?1:0)+(r?1:0)),u&&o.c&&(u=u&&o.c(l,i,s)),u)break;o=null}u||(s.e=i.t0),o&&(s.n=null!=o.n?o.n:s.n,s.h=null!=o.h?o.h:s.h,s.a=null!=o.a?o.a:s.a,s.u=null!=o.u?o.u:s.u,s.k=null!=o.k?o.k:s.k,s.g=null!=o.g?o.g:s.g,s.e=o.e&&o.e(l,i,s)||void 0,s.p=null!=o.p&&!1!==o.p?"string"==typeof o.p?o.p:o.p(l,i,s):s.p,s.r=null!=o.r&&!1!==o.r?"string"==typeof o.r?o.r:o.r(l,i,s):s.r,s.b=null!=o.b&&!1!==o.b?"number"==typeof o.b?o.b:o.b(l,i,s):s.b);let g=c<t.length;return i.log&&i.log(a.S.parse,i,l,n,g,u,c,o,s),s}(i,d,n,e,t):h;if(f.h&&(f=f.h(e,t,f,s)||f,o+="H"),f.e)return this.bad(f.e,e,t,{is_open:i});if(f.n)for(let r in f.n)e.n[r]=0===f.n[r]?0:(null==e.n[r]?0:e.n[r])+f.n[r];if(f.u&&(e.u=Object.assign(e.u,f.u)),f.k&&(e.k=Object.assign(e.k,f.k)),f.a){o+="A";let n=f.a(e,t,f);if(n&&n.isToken&&n.err)return this.bad(n,e,t,{is_open:i})}if(f.p){t.rs[t.rsI++]=e;let n=t.rsm[f.p];if(!n)return this.bad(this.unknownRule(t.t0,f.p),e,t,{is_open:i});s=e.child=u(n,t,e.node),s.parent=e,s.n={...e.n},0<Object.keys(e.k).length&&(s.k={...e.k}),o+="P`"+f.p+"`"}else if(f.r){let n=t.rsm[f.r];if(!n)return this.bad(this.unknownRule(t.t0,f.r),e,t,{is_open:i});s=u(n,t,e.node),s.parent=e.parent,s.prev=e,s.n={...e.n},0<Object.keys(e.k).length&&(s.k={...e.k}),o+="R`"+f.r+"`"}else i||(s=t.rs[--t.rsI]||t.NORULE);let g=i?e.ao?c.ao:null:e.ac?c.ac:null;if(g){let n;for(let r=0;r<g.length;r++)if(n=g[r](e,t,s,n),(null==n?void 0:n.isToken)&&(null==n?void 0:n.err))return this.bad(n,e,t,{is_open:i})}s.why=o,t.log&&t.log(a.S.node,t,e,n,s),r.OPEN===e.state&&(e.state=r.CLOSE);let k=e[i?"os":"cs"]-(f.b||0);return 1===k?(t.v2=t.v1,t.v1=t.t0,t.t0=t.t1,t.t1=t.NOTOKEN):2==k&&(t.v2=t.t1,t.v1=t.t0,t.t0=t.NOTOKEN,t.t1=t.NOTOKEN),s}bad(e,t,n,r){throw new a.JsonicError(e.err||a.S.unexpected,{...e.use,state:r.is_open?a.S.open:a.S.close},e,t,n)}unknownRule(e,t){return e.err="unknown_rule",e.use=e.use||{},e.use.rulename=t,e}}const g=(...e)=>new f(...e);function k(e){if(r.STRING===typeof e.g?e.g=e.g.split(/\s*,\s*/):null==e.g&&(e.g=[]),e.g=e.g.sort(),e.s&&0!==e.s.length){const t=e=>e.flat().filter(e=>"number"==typeof e),n=(e,t)=>e.filter(e=>31*t<=e&&e<31*(t+1)),r=(e,t)=>e.reduce((e,n)=>1<<n-(31*t+1)|e,0),l=t([e.s[0]]),i=t([e.s[1]]),s=e;s.S0=0<l.length?new Array(Math.max(...l.map(e=>1+e/31|0))).fill(null).map((e,t)=>t).map(e=>r(n(l,e),e)):null,s.S1=0<i.length?new Array(Math.max(...i.map(e=>1+e/31|0))).fill(null).map((e,t)=>t).map(e=>r(n(i,e),e)):null}else e.s=null;return e.p||(e.p=null),e.r||(e.r=null),e.b||(e.b=null),e}o.makeRuleSpec=g;var v={};Object.defineProperty(v,"__esModule",{value:!0}),v.makeParser=v.makeRuleSpec=v.makeRule=void 0;const b=t({}),x=n({});Object.defineProperty(v,"makeRule",{enumerable:!0,get:function(){return o.makeRule}}),Object.defineProperty(v,"makeRuleSpec",{enumerable:!0,get:function(){return o.makeRuleSpec}});class y{constructor(e,t){this.rsm={},this.options=e,this.cfg=t}rule(e,t){if(null==e)return this.rsm;let n=this.rsm[e];if(null===t)delete this.rsm[e];else if(void 0!==t)return n=this.rsm[e]=this.rsm[e]||(0,o.makeRuleSpec)(this.cfg,{}),n=this.rsm[e]=t(this.rsm[e],this)||this.rsm[e],void(n.name=e);return n}start(e,t,n,l){let i,s=(0,x.makeToken)("#ZZ",(0,b.tokenize)("#ZZ",this.cfg),void 0,r.EMPTY,(0,x.makePoint)(-1)),a=(0,x.makeNoToken)(),c={uI:0,opts:this.options,cfg:this.cfg,meta:n||{},src:()=>e,root:()=>i,plgn:()=>t.internal().plugins,inst:()=>t,rule:{},sub:t.internal().sub,xs:-1,v2:s,v1:s,t0:a,t1:a,tC:-2,kI:-1,rs:[],rsI:0,rsm:this.rsm,log:void 0,F:(0,b.srcfmt)(this.cfg),u:{},NOTOKEN:a,NORULE:{}};c=(0,b.deep)(c,l);let u=(0,o.makeNoRule)(c);if(c.NORULE=u,c.rule=u,n&&b.S.function===typeof n.log&&(c.log=n.log),this.cfg.parse.prepare.forEach(e=>e(t,c,n)),""===e){if(this.cfg.lex.empty)return this.cfg.lex.emptyResult;throw new b.JsonicError(b.S.unexpected,{src:e},c.t0,u,c)}let d=(0,b.badlex)((0,x.makeLex)(c),(0,b.tokenize)("#BD",this.cfg),c),p=this.rsm[this.cfg.rule.start];if(null==p)return;let m=(0,o.makeRule)(p,c);i=m;let h=2*(0,b.keys)(this.rsm).length*d.src.length*2*c.cfg.rule.maxmul,f=0;for(;u!==m&&f<h;)c.kI=f,c.rule=m,c.log&&c.log("",c.kI+":"),c.sub.rule&&c.sub.rule.map(e=>e(m,c)),m=m.process(c,d),c.log&&c.log(b.S.stack,c,m,d),f++;if(s.tin!==d.next(m).tin)throw new b.JsonicError(b.S.unexpected,{},c.t0,u,c);const g=c.root().node;if(this.cfg.result.fail.includes(g))throw new b.JsonicError(b.S.unexpected,{},c.t0,u,c);return g}clone(e,t){let n=new y(e,t);return n.rsm=Object.keys(this.rsm).reduce((e,t)=>(e[t]=(0,b.filterRules)(this.rsm[t],this.cfg),e),{}),n.norm(),n}norm(){(0,b.values)(this.rsm).map(e=>e.norm())}}v.makeParser=(...e)=>new y(...e);var S={};function j(e){const{deep:t}=e.util,{OB:n,CB:r,OS:l,CS:i,CL:s,CA:o,TX:a,ST:c,ZZ:u}=e.token,{VAL:d,KEY:p}=e.tokenSet,m=(e,t)=>{if(!t.cfg.rule.finish)return t.t0.src="END_OF_SOURCE",t.t0},h=e=>{const t=e.o0,n=c===t.tin||a===t.tin?t.val:t.src;e.u.key=n};e.rule("val",e=>{e.bo(e=>e.node=void 0).open([{s:[n],p:"map",b:1,g:"map,json"},{s:[l],p:"list",b:1,g:"list,json"},{s:[d],g:"val,json"}]).close([{s:[u],g:"end,json"},{b:1,g:"more,json"}]).bc((e,t)=>{e.node=void 0===e.node?void 0===e.child.node?0===e.os?void 0:e.o0.resolveVal(e,t):e.child.node:e.node})}),e.rule("map",e=>{e.bo(e=>{e.node=Object.create(null)}).open([{s:[n,r],b:1,n:{pk:0},g:"map,json"},{s:[n],p:"pair",n:{pk:0},g:"map,json,pair"}]).close([{s:[r],g:"end,json"}])}),e.rule("list",e=>{e.bo(e=>{e.node=[]}).open([{s:[l,i],b:1,g:"list,json"},{s:[l],p:"elem",g:"list,elem,json"}]).close([{s:[i],g:"end,json"}])}),e.rule("pair",e=>{e.open([{s:[p,s],p:"val",u:{pair:!0},a:h,g:"map,pair,key,json"}]).bc((e,t)=>{e.u.pair&&(e.u.prev=e.node[e.u.key],e.node[e.u.key]=e.child.node)}).close([{s:[o],r:"pair",g:"map,pair,json"},{s:[r],b:1,g:"map,pair,json"}])}),e.rule("elem",e=>{e.open([{p:"val",g:"list,elem,val,json"}]).bc(e=>{!0!==e.u.done&&e.node.push(e.child.node)}).close([{s:[o],r:"elem",g:"list,elem,json"},{s:[i],b:1,g:"list,elem,json"}])});const f=(e,n)=>{let r=e.u.key,l=e.child.node;const i=e.u.prev;l=void 0===l?null:l,e.u.list&&n.cfg.safe.key&&("__proto__"===r||"constructor"===r)||(e.node[r]=null==i?l:n.cfg.map.merge?n.cfg.map.merge(i,l,e,n):n.cfg.map.extend?t(i,l):l)};e.rule("val",e=>{e.open([{s:[p,s],p:"map",b:2,n:{pk:1},g:"pair,jsonic"},{s:[d],g:"val,json"},{s:[[r,i]],b:1,c:e=>0<e.d,g:"val,imp,null,jsonic"},{s:[o],c:e=>0===e.d,p:"list",b:1,g:"list,imp,jsonic"},{s:[o],b:1,g:"list,val,imp,null,jsonic"},{s:[u],g:"jsonic"}],{append:!0,delete:[2]}).close([{s:[[r,i]],b:1,g:"val,json,close",e:(e,t)=>0===e.d?t.t0:void 0},{s:[o],c:e=>e.lte("dlist")&&e.lte("dmap"),r:"list",u:{implist:!0},g:"list,val,imp,comma,jsonic"},{c:e=>e.lte("dlist")&&e.lte("dmap"),r:"list",u:{implist:!0},g:"list,val,imp,space,jsonic",b:1},{s:[u],g:"jsonic"}],{append:!0,move:[1,-1]})}),e.rule("map",e=>{e.bo(e=>{e.n.dmap=1+(e.n.dmap?e.n.dmap:0)}).open([{s:[n,u],b:1,e:m,g:"end,jsonic"}]).open([{s:[p,s],p:"pair",b:2,g:"pair,list,val,imp,jsonic"}],{append:!0}).close([{s:[r],c:e=>e.lte("pk"),g:"end,json"},{s:[r],b:1,g:"path,jsonic"},{s:[[o,i,...d]],b:1,g:"end,path,jsonic"},{s:[u],e:m,g:"end,jsonic"}],{append:!0,delete:[0]})}),e.rule("list",e=>{e.bo(e=>{e.n.dlist=1+(e.n.dlist?e.n.dlist:0),e.prev.u.implist&&(e.node.push(e.prev.node),e.prev.node=e.node)}).open({c:e=>e.prev.u.implist,p:"elem"}).open([{s:[o],p:"elem",b:1,g:"list,elem,val,imp,jsonic"},{p:"elem",g:"list,elem.jsonic"}],{append:!0}).close([{s:[u],e:m,g:"end,jsonic"}],{append:!0})}),e.rule("pair",(e,t)=>{e.open([{s:[o],g:"map,pair,comma,jsonic"}],{append:!0}).bc((e,t)=>{e.u.pair&&f(e,t)}).close([{s:[r],c:e=>e.lte("pk"),b:1,g:"map,pair,json"},{s:[o,r],c:e=>e.lte("pk"),b:1,g:"map,pair,comma,jsonic"},{s:[o,u],g:"end,jsonic"},{s:[o],c:e=>e.lte("pk"),r:"pair",g:"map,pair,json"},{s:[o],c:e=>e.lte("dmap",1),r:"pair",g:"map,pair,jsonic"},{s:[p],c:e=>e.lte("dmap",1),r:"pair",b:1,g:"map,pair,imp,jsonic"},{s:[[r,o,i,...p]],c:e=>0<e.n.pk,b:1,g:"map,pair,imp,path,jsonic"},{s:[i],e:e=>e.c0,g:"end,jsonic"},{s:[u],e:m,g:"map,pair,json"},{r:"pair",b:1,g:"map,pair,imp,jsonic"}],{append:!0,delete:[0,1]})}),e.rule("elem",(e,t)=>{e.open([{s:[o,o],b:2,u:{done:!0},a:e=>e.node.push(null),g:"list,elem,imp,null,jsonic"},{s:[o],u:{done:!0},a:e=>e.node.push(null),g:"list,elem,imp,null,jsonic"},{s:[p,s],e:t.cfg.list.property?void 0:(e,t)=>t.t0,p:"val",n:{pk:1,dmap:1},u:{done:!0,pair:!0,list:!0},a:h,g:"elem,pair,jsonic"}]).bc((e,t)=>{!0===e.u.pair&&(e.u.prev=e.node[e.u.key],f(e,t))}).close([{s:[o,[i,u]],b:1,g:"list,elem,comma,jsonic"},{s:[o],r:"elem",g:"list,elem,json"},{s:[i],b:1,g:"list,elem,json"},{s:[u],e:m,g:"list,elem,json"},{s:[r],e:e=>e.c0,g:"end,jsonic"},{r:"elem",b:1,g:"list,elem,imp,jsonic"}],{delete:[-1,-2]})})}Object.defineProperty(S,"__esModule",{value:!0}),S.makeJSON=S.grammar=void 0,S.grammar=j,S.makeJSON=function(e){let t=e.make({grammar$:!1,text:{lex:!1},number:{hex:!1,oct:!1,bin:!1,sep:null,exclude:/^00+/},string:{chars:'"',multiChars:"",allowUnknown:!1,escape:{v:null}},comment:{lex:!1},map:{extend:!1},lex:{empty:!1},rule:{finish:!1,include:"json"},result:{fail:[void 0,NaN]},tokenSet:{KEY:["#ST",null,null,null]}});return j(t),t};var E={exports:{}};Object.defineProperty(E.exports,"__esModule",{value:!0}),E.exports.root=E.exports.S=E.exports.EMPTY=E.exports.AFTER=E.exports.BEFORE=E.exports.CLOSE=E.exports.OPEN=E.exports.makeTextMatcher=E.exports.makeNumberMatcher=E.exports.makeCommentMatcher=E.exports.makeStringMatcher=E.exports.makeLineMatcher=E.exports.makeSpaceMatcher=E.exports.makeFixedMatcher=E.exports.makeParser=E.exports.makeLex=E.exports.makeRuleSpec=E.exports.makeRule=E.exports.makePoint=E.exports.makeToken=E.exports.make=E.exports.util=E.exports.JsonicError=E.exports.Jsonic=void 0,Object.defineProperty(E.exports,"OPEN",{enumerable:!0,get:function(){return r.OPEN}}),Object.defineProperty(E.exports,"CLOSE",{enumerable:!0,get:function(){return r.CLOSE}}),Object.defineProperty(E.exports,"BEFORE",{enumerable:!0,get:function(){return r.BEFORE}}),Object.defineProperty(E.exports,"AFTER",{enumerable:!0,get:function(){return r.AFTER}}),Object.defineProperty(E.exports,"EMPTY",{enumerable:!0,get:function(){return r.EMPTY}});const O=t({});Object.defineProperty(E.exports,"JsonicError",{enumerable:!0,get:function(){return O.JsonicError}}),Object.defineProperty(E.exports,"S",{enumerable:!0,get:function(){return O.S}});const I=n({});Object.defineProperty(E.exports,"makePoint",{enumerable:!0,get:function(){return I.makePoint}}),Object.defineProperty(E.exports,"makeToken",{enumerable:!0,get:function(){return I.makeToken}}),Object.defineProperty(E.exports,"makeLex",{enumerable:!0,get:function(){return I.makeLex}}),Object.defineProperty(E.exports,"makeFixedMatcher",{enumerable:!0,get:function(){return I.makeFixedMatcher}}),Object.defineProperty(E.exports,"makeSpaceMatcher",{enumerable:!0,get:function(){return I.makeSpaceMatcher}}),Object.defineProperty(E.exports,"makeLineMatcher",{enumerable:!0,get:function(){return I.makeLineMatcher}}),Object.defineProperty(E.exports,"makeStringMatcher",{enumerable:!0,get:function(){return I.makeStringMatcher}}),Object.defineProperty(E.exports,"makeCommentMatcher",{enumerable:!0,get:function(){return I.makeCommentMatcher}}),Object.defineProperty(E.exports,"makeNumberMatcher",{enumerable:!0,get:function(){return I.makeNumberMatcher}}),Object.defineProperty(E.exports,"makeTextMatcher",{enumerable:!0,get:function(){return I.makeTextMatcher}}),Object.defineProperty(E.exports,"makeRule",{enumerable:!0,get:function(){return v.makeRule}}),Object.defineProperty(E.exports,"makeRuleSpec",{enumerable:!0,get:function(){return v.makeRuleSpec}}),Object.defineProperty(E.exports,"makeParser",{enumerable:!0,get:function(){return v.makeParser}});const T={tokenize:O.tokenize,srcfmt:O.srcfmt,clone:O.clone,charset:O.charset,trimstk:O.trimstk,makelog:O.makelog,badlex:O.badlex,extract:O.extract,errinject:O.errinject,errdesc:O.errdesc,configure:O.configure,parserwrap:O.parserwrap,mesc:O.mesc,escre:O.escre,regexp:O.regexp,prop:O.prop,str:O.str,clean:O.clean,deep:O.deep,omap:O.omap,keys:O.keys,values:O.values,entries:O.entries};function M(e,t){let n=!0;if("jsonic"===e)n=!1;else if("json"===e)return(0,S.makeJSON)(N);e="string"==typeof e?{}:e;let r={parser:null,config:null,plugins:[],sub:{lex:void 0,rule:void 0},mark:Math.random()},i=(0,O.deep)({},t?{...t.options}:!1===(null==e?void 0:e.defaults$)?{}:l.defaults,e||{}),s=function(e,t,n){var r;if(O.S.string===typeof e){let l=s.internal();return((null===(r=o.parser)||void 0===r?void 0:r.start)?(0,O.parserwrap)(o.parser):l.parser).start(e,s,t,n)}return e},o=e=>{if(null!=e&&O.S.object===typeof e){(0,O.deep)(i,e),(0,O.configure)(s,r.config,i);let t=s.internal().parser;r.parser=t.clone(i,r.config)}return{...s.options}},a={token:e=>(0,O.tokenize)(e,r.config,s),tokenSet:e=>(0,O.findTokenSet)(e,r.config),fixed:e=>r.config.fixed.ref[e],options:(0,O.deep)(o,i),config:()=>(0,O.deep)(r.config),parse:s,use:function(e,t){if(O.S.function!==typeof e)throw new Error("Jsonic.use: the first argument must be a function defining a plugin. See https://jsonic.senecajs.org/plugin");const n=e.name.toLowerCase(),r=(0,O.deep)({},e.defaults||{},t||{});s.options({plugin:{[n]:r}});let l=s.options.plugin[n];return s.internal().plugins.push(e),e.options=l,e(s,l)||s},rule:(e,t)=>s.internal().parser.rule(e,t)||s,make:e=>M(e,s),empty:e=>M({defaults$:!1,standard$:!1,grammar$:!1,...e||{}}),id:"Jsonic/"+Date.now()+"/"+(""+Math.random()).substring(2,8).padEnd(6,"0")+(null==o.tag?"":"/"+o.tag),toString:()=>a.id,sub:e=>(e.lex&&(r.sub.lex=r.sub.lex||[],r.sub.lex.push(e.lex)),e.rule&&(r.sub.rule=r.sub.rule||[],r.sub.rule.push(e.rule)),s),util:T};if((0,O.defprop)(a.make,O.S.name,{value:O.S.make}),n?(0,O.assign)(s,a):(0,O.assign)(s,{empty:a.empty,parse:a.parse,sub:a.sub,id:a.id,toString:a.toString}),(0,O.defprop)(s,"internal",{value:()=>r}),t){for(let n in t)void 0===s[n]&&(s[n]=t[n]);s.parent=t;let e=t.internal();r.config=(0,O.deep)({},e.config),(0,O.configure)(s,r.config,i),(0,O.assign)(s.token,r.config.t),r.plugins=[...e.plugins],r.parser=e.parser.clone(i,r.config)}else{let e={...s,...a};r.config=(0,O.configure)(e,void 0,i),r.plugins=[],r.parser=(0,v.makeParser)(i,r.config),!1!==i.grammar$&&(0,S.grammar)(e)}return s}let N;E.exports.util=T,E.exports.make=M,E.exports.root=N;let P=E.exports.root=N=M("jsonic");return E.exports.Jsonic=P,N.Jsonic=N,N.JsonicError=O.JsonicError,N.makeLex=I.makeLex,N.makeParser=v.makeParser,N.makeToken=I.makeToken,N.makePoint=I.makePoint,N.makeRule=v.makeRule,N.makeRuleSpec=v.makeRuleSpec,N.makeFixedMatcher=I.makeFixedMatcher,N.makeSpaceMatcher=I.makeSpaceMatcher,N.makeLineMatcher=I.makeLineMatcher,N.makeStringMatcher=I.makeStringMatcher,N.makeCommentMatcher=I.makeCommentMatcher,N.makeNumberMatcher=I.makeNumberMatcher,N.makeTextMatcher=I.makeTextMatcher,N.OPEN=r.OPEN,N.CLOSE=r.CLOSE,N.BEFORE=r.BEFORE,N.AFTER=r.AFTER,N.EMPTY=r.EMPTY,N.util=T,N.make=M,N.S=O.S,E.exports.default=P,E.exports=P,E=E.exports}));
}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],31:[function(require,module,exports){
"use strict";
/* Copyright (c) 2021 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.meta = exports.TOP = exports.NONE = exports.resolvePathSpec = exports.MultiSource = void 0;
const jsonic_next_1 = require("@jsonic/jsonic-next");
const directive_1 = require("@jsonic/directive");
const jsonic_1 = require("./processor/jsonic");
const js_1 = require("./processor/js");
// Unknown source reference file extension.
const NONE = '';
exports.NONE = NONE;
// The top of the dependence tree.
const TOP = Symbol('TOP');
exports.TOP = TOP;
const MultiSource = (jsonic, popts) => {
    const markchar = popts.markchar;
    const resolver = popts.resolver;
    const processor = popts.processor;
    const { deep } = jsonic.util;
    // Normalize implicit extensions to format `.name`.
    const implictExt = (popts.implictExt || []);
    for (let extI = 0; extI < implictExt.length; extI++) {
        let ext = implictExt[extI];
        implictExt[extI] = ext.startsWith('.') ? ext : '.' + ext;
    }
    jsonic.options({
        error: {
            multisource_not_found: 'source not found: $path',
        },
        hint: {
            // TODO: use $details for more explanation in error message.
            // In particular to show resolved absolute path.
            multisource_not_found: 'The source path $path was not found.\n\nSearch paths:\n${searchstr}',
        },
    });
    // Define a directive that can load content from multiple sources.
    let dopts = {
        name: 'multisource',
        open: markchar,
        rules: {
            open: 'val,pair',
        },
        action: function multisourceStateAction(rule, ctx) {
            var _a, _b;
            let from = rule.parent.name;
            let spec = rule.child.node;
            // console.log('SRC', from, spec)
            let res = resolver(spec, popts, rule, ctx, jsonic);
            // console.log('RES', res)
            if (!res.found) {
                return (_a = rule.parent) === null || _a === void 0 ? void 0 : _a.o0.bad('multisource_not_found', {
                    ...res,
                    searchstr: ((res === null || res === void 0 ? void 0 : res.search) || [res.full]).join('\n'),
                });
            }
            let fullpath = null != res.full ? res.full : null != res.path ? res.path : 'no-path';
            res.kind = null == res.kind ? NONE : res.kind;
            // Pass down any meta info.
            let msmeta = ((_b = ctx.meta) === null || _b === void 0 ? void 0 : _b.multisource) || {};
            let parents = msmeta.parents || [];
            if (null != msmeta.path) {
                parents.push(msmeta.path);
            }
            let meta = {
                ...(ctx.meta || {}),
                fileName: res.path,
                multisource: {
                    ...msmeta,
                    parents,
                    path: res.full,
                },
            };
            // Build dependency tree branch.
            if (msmeta.deps) {
                let depmap = msmeta.deps;
                let parent = (msmeta.path || TOP);
                if (null != parent) {
                    let dep = {
                        tar: parent,
                        src: fullpath,
                        wen: Date.now(),
                    };
                    depmap[parent] = depmap[parent] || {};
                    depmap[parent][fullpath] = dep;
                }
            }
            // ctx.meta = meta
            let ctxproc = {
                ...ctx,
                meta,
            };
            let proc = processor[res.kind] || processor[NONE];
            // console.log('FROM', from, 'PROC', proc, processor, ctxproc.meta)
            proc(res, popts, rule, ctxproc, jsonic);
            // Handle the {@foo} case, injecting keys into parent map.
            if ('pair' === from) {
                if (ctx.cfg.map.merge) {
                    rule.parent.parent.node = ctx.cfg.map.merge(rule.parent.parent.node, res.val, rule, ctx);
                }
                else if (ctx.cfg.map.extend) {
                    rule.parent.parent.node = deep(rule.parent.parent.node, res.val);
                }
                else {
                    Object.assign(rule.parent.node, res.val);
                }
            }
            else {
                rule.node = res.val;
            }
            // rule.node = res.val
            return undefined;
        },
        custom: (jsonic, { OPEN, name }) => {
            // Handle special case of @foo first token - assume a map
            jsonic.rule('val', (rs) => {
                rs.open({
                    s: [OPEN],
                    c: (r) => 0 === r.d,
                    p: 'map',
                    b: 1,
                    n: { [name + '_top']: 1 },
                });
            });
            jsonic.rule('map', (rs) => {
                rs.open({
                    s: [OPEN],
                    c: (r) => 1 === r.d && 1 === r.n[name + '_top'],
                    p: 'pair',
                    b: 1,
                });
            });
        },
    };
    jsonic.use(directive_1.Directive, dopts);
};
exports.MultiSource = MultiSource;
// Convenience maker for Processors
function makeProcessor(process) {
    return (res) => (res.val = process(res.src, res));
}
// Default is just to insert file contents as a string.
const defaultProcessor = makeProcessor((src) => src);
const jsonicJsonParser = jsonic_next_1.Jsonic.make('json');
// TODO: use json plugin to get better error msgs.
const jsonProcessor = makeProcessor((src, res) => 
// null == src ? undefined : JSON.parse(src)
null == src ? undefined : jsonicJsonParser(src, { fileName: res.path }));
const jsonicProcessor = (0, jsonic_1.makeJsonicProcessor)();
const jsProcessor = (0, js_1.makeJavaScriptProcessor)();
MultiSource.defaults = {
    markchar: '@',
    processor: {
        [NONE]: defaultProcessor,
        jsonic: jsonicProcessor,
        jsc: jsonicProcessor,
        json: jsonProcessor,
        js: jsProcessor,
    },
    implictExt: ['jsonic', 'jsc', 'json', 'js'],
};
function resolvePathSpec(popts, ctx, spec, resolvefolder) {
    var _a;
    let msmeta = (_a = ctx.meta) === null || _a === void 0 ? void 0 : _a.multisource;
    let base = resolvefolder(null == msmeta || null == msmeta.path ? popts.path : msmeta.path);
    let path = 'string' === typeof spec
        ? spec
        : null != spec.path
            ? '' + spec.path
            : undefined;
    let abs = !!((path === null || path === void 0 ? void 0 : path.startsWith('/')) || (path === null || path === void 0 ? void 0 : path.startsWith('\\')));
    let full = abs
        ? path
        : null != path && '' != path
            ? null != base && '' != base
                ? base + '/' + path
                : path
            : undefined;
    let kind = null == full ? NONE : (full.match(/\.([^.]*)$/) || [NONE, NONE])[1];
    let res = {
        kind,
        path,
        full,
        base,
        abs,
        found: false,
    };
    return res;
}
exports.resolvePathSpec = resolvePathSpec;
// Plugin meta data
const meta = {
    name: 'MultiSource',
};
exports.meta = meta;

},{"./processor/js":32,"./processor/jsonic":33,"@jsonic/directive":27,"@jsonic/jsonic-next":30}],32:[function(require,module,exports){
"use strict";
/* Copyright (c) 2021 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeJavaScriptProcessor = void 0;
function makeJavaScriptProcessor(opts) {
    const JavaScriptProcessor = (res) => {
        res.val = evaluate(res, opts);
    };
    JavaScriptProcessor.opts = opts;
    return JavaScriptProcessor;
}
exports.makeJavaScriptProcessor = makeJavaScriptProcessor;
// TODO: too simplistic - handle more module cases
function evaluate(res, _opts) {
    let out = undefined;
    // if (true !== opts?.evalOnly && undefined !== typeof (require)) {
    out = require(res.full);
    out = null != out.default ? out.default : out;
    // }
    // else {
    //   let exports = null
    //   let module = { exports }
    //   eval((res.src as string))
    //   out = module.exports
    // }
    return out;
}

},{}],33:[function(require,module,exports){
"use strict";
/* Copyright (c) 2021-2023 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeJsonicProcessor = void 0;
function makeJsonicProcessor() {
    return function JsonicProcessor(res, _popts, _rule, ctx, jsonic) {
        if (null != res.src && null != res.full) {
            res.val = jsonic(res.src, ctx.meta);
        }
    };
}
exports.makeJsonicProcessor = makeJsonicProcessor;

},{}],34:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeFileResolver = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const multisource_1 = require("../multisource");
const mem_1 = require("./mem");
function makeFileResolver(pathfinder) {
    return function FileResolver(spec, popts, _rule, ctx) {
        let foundSpec = pathfinder ? pathfinder(spec) : spec;
        let ps = (0, multisource_1.resolvePathSpec)(popts, ctx, foundSpec, resolvefolder);
        let src = undefined;
        let search = [];
        if (null != ps.full) {
            ps.full = path_1.default.resolve(ps.full);
            search.push(ps.full);
            src = load(ps.full);
            if (null == src && multisource_1.NONE === ps.kind) {
                let potentials = (0, mem_1.buildPotentials)(ps, popts, (...s) => path_1.default.resolve(s.reduce((a, p) => path_1.default.join(a, p))));
                search.push(...potentials);
                for (let path of potentials) {
                    if (null != (src = load(path))) {
                        ps.full = path;
                        ps.kind = (path.match(/\.([^.]*)$/) || [multisource_1.NONE, multisource_1.NONE])[1];
                        break;
                    }
                }
            }
        }
        let res = {
            ...ps,
            src,
            found: null != src,
            search,
        };
        return res;
    };
}
exports.makeFileResolver = makeFileResolver;
function resolvefolder(path) {
    if ('string' !== typeof path) {
        return path;
    }
    let folder = path;
    let pathstats = fs_1.default.statSync(path);
    if (pathstats.isFile()) {
        let pathdesc = path_1.default.parse(path);
        folder = pathdesc.dir;
    }
    return folder;
}
// TODO: in multisource.ts, generate an error token if cannot resolve
function load(path) {
    try {
        return fs_1.default.readFileSync(path).toString();
    }
    catch (e) {
        // NOTE: don't need this, as in all cases, we consider failed
        // reads to indicate non-existence.
    }
}

},{"../multisource":31,"./mem":35,"fs":42,"path":69}],35:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeMemResolver = exports.buildPotentials = void 0;
const multisource_1 = require("../multisource");
function makeMemResolver(filemap) {
    return function MemResolver(spec, popts, _rule, ctx) {
        // TODO: support pathfinder as file.ts
        let ps = (0, multisource_1.resolvePathSpec)(popts, ctx, spec, makeresolvefolder(filemap));
        let src = undefined;
        if (null != ps.full) {
            src = filemap[ps.full];
            if (null == src && multisource_1.NONE === ps.kind) {
                let potentials = buildPotentials(ps, popts, (...s) => s.reduce((a, p) => a + '/' + p));
                for (let path of potentials) {
                    if (null != (src = filemap[path])) {
                        ps.full = path;
                        ps.kind = (path.match(/\.([^.]*)$/) || [multisource_1.NONE, multisource_1.NONE])[1];
                        break;
                    }
                }
            }
        }
        let res = {
            ...ps,
            src,
            found: null != src
        };
        return res;
    };
}
exports.makeMemResolver = makeMemResolver;
function makeresolvefolder(filemap) {
    return function resolvefolder(path) {
        let folder = path;
        if (filemap[path]) {
            folder = (path
                .replace(/[\\\/]+$/, '')
                .match(/[\\\/]+([^\\\/]+)$/) || ['', ''])[1];
            // console.log('PF', path, folder)
        }
        // console.log('RF', folder)
        return folder;
    };
}
function buildPotentials(ps, popts, pathjoin) {
    let full = ps.full;
    let potentials = [];
    let implictExt = popts.implictExt || [];
    let hasExt = full.match(implictExt.join('|') + '$');
    // TODO: use Jsonic.util.escre
    if (!hasExt) {
        // Implicit extensions.
        for (let ext of implictExt) {
            potentials.push(full + ext);
        }
        // Folder index file.
        for (let ext of implictExt) {
            potentials.push(pathjoin(full, 'index' + ext));
        }
        // Folder index file (includes folder name).
        if (null != ps.path) {
            let folder = (ps.path
                .replace(/[\\\/]+$/, '')
                .match(/[^\\\/]+$/) || [])[0];
            if (null != folder) {
                for (let ext of implictExt) {
                    potentials.push(pathjoin(full, 'index.' + folder + ext));
                }
            }
        }
    }
    // console.log('POT', potentials)
    return potentials;
}
exports.buildPotentials = buildPotentials;

},{"../multisource":31}],36:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makePkgResolver = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const multisource_1 = require("../multisource");
const mem_1 = require("./mem");
function makePkgResolver(options) {
    let useRequire = require;
    let requireOptions = undefined;
    if ('function' === typeof options.require) {
        useRequire = options.require;
    }
    else if (Array.isArray(options.require)) {
        requireOptions = {
            paths: options.require
        };
    }
    else if ('string' === typeof options.require) {
        requireOptions = {
            paths: [options.require]
        };
    }
    return function PkgResolver(spec, popts, _rule, ctx) {
        // TODO: support pathfinder as file.ts
        let foundSpec = spec;
        let ps = (0, multisource_1.resolvePathSpec)(popts, ctx, foundSpec, resolvefolder);
        let src = undefined;
        let search = [];
        if (null != ps.path) {
            try {
                ps.full = useRequire.resolve(ps.path, requireOptions);
                if (null != ps.full) {
                    src = load(ps.full);
                    ps.kind = (ps.full.match(/\.([^.]*)$/) || [multisource_1.NONE, multisource_1.NONE])[1];
                }
            }
            catch (me) {
                search.push(...((requireOptions === null || requireOptions === void 0 ? void 0 : requireOptions.paths) || (useRequire.resolve.paths(ps.path)
                    .map((p) => path_1.default.join(p, ps.path)))));
                let potentials = (0, mem_1.buildPotentials)(ps, popts, (...s) => path_1.default.resolve(s.reduce((a, p) => path_1.default.join(a, p))));
                for (let path of potentials) {
                    try {
                        ps.full = useRequire.resolve(path, requireOptions);
                        if (null != ps.full) {
                            src = load(ps.full);
                            ps.kind = (ps.full.match(/\.([^.]*)$/) || [multisource_1.NONE, multisource_1.NONE])[1];
                            break;
                        }
                    }
                    catch (me) {
                        search.push(...((requireOptions === null || requireOptions === void 0 ? void 0 : requireOptions.paths) || (useRequire.resolve.paths(path)
                            .map((p) => path_1.default.join(p, path)))));
                    }
                }
            }
        }
        let res = {
            ...ps,
            src,
            found: null != src,
            search,
        };
        return res;
    };
}
exports.makePkgResolver = makePkgResolver;
function resolvefolder(path) {
    if ('string' !== typeof path) {
        return path;
    }
    let folder = path;
    let pathstats = fs_1.default.statSync(path);
    if (pathstats.isFile()) {
        let pathdesc = path_1.default.parse(path);
        folder = pathdesc.dir;
    }
    return folder;
}
// TODO: in multisource.ts, generate an error token if cannot resolve
function load(path) {
    try {
        return fs_1.default.readFileSync(path).toString();
    }
    catch (e) {
        // NOTE: don't need this, as in all cases, we consider failed
        // reads to indicate non-existence.
    }
}

},{"../multisource":31,"./mem":35,"fs":42,"path":69}],37:[function(require,module,exports){
(function (global){(function (){
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{("undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this).JsonicPath=e()}}((function(){var e={};Object.defineProperty(e,"__esModule",{value:!0}),e.Path=void 0;const d=(e,d)=>{e.rule("val",e=>{e.bo(e=>{0===e.d&&(e.k.path=[])})}),e.rule("map",e=>{e.bo(e=>{delete e.k.index})}),e.rule("pair",e=>{e.ao(e=>{0<e.d&&e.u.pair&&(e.child.k.path=[...e.k.path,e.u.key],e.child.k.key=e.u.key)})}),e.rule("list",e=>{e.bo(e=>{e.k.index=-1})}),e.rule("elem",e=>{e.ao(e=>{0<e.d&&(e.k.index=1+e.k.index,e.child.k.path=[...e.k.path,e.k.index],e.child.k.key=e.k.index,e.child.k.index=e.k.index)})})};return e.Path=d,d.defaults={},e}));
}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],38:[function(require,module,exports){
(function (global){(function (){
'use strict';

var objectAssign = require('object.assign/polyfill')();

// compare and isBuffer taken from https://github.com/feross/buffer/blob/680e9e5e488f22aac27599a57dc844a6315928dd/index.js
// original notice:

/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
function compare(a, b) {
  if (a === b) {
    return 0;
  }

  var x = a.length;
  var y = b.length;

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i];
      y = b[i];
      break;
    }
  }

  if (x < y) {
    return -1;
  }
  if (y < x) {
    return 1;
  }
  return 0;
}
function isBuffer(b) {
  if (global.Buffer && typeof global.Buffer.isBuffer === 'function') {
    return global.Buffer.isBuffer(b);
  }
  return !!(b != null && b._isBuffer);
}

// based on node assert, original notice:
// NB: The URL to the CommonJS spec is kept just for tradition.
//     node-assert has evolved a lot since then, both in API and behavior.

// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

var util = require('util/');
var hasOwn = Object.prototype.hasOwnProperty;
var pSlice = Array.prototype.slice;
var functionsHaveNames = (function () {
  return function foo() {}.name === 'foo';
}());
function pToString (obj) {
  return Object.prototype.toString.call(obj);
}
function isView(arrbuf) {
  if (isBuffer(arrbuf)) {
    return false;
  }
  if (typeof global.ArrayBuffer !== 'function') {
    return false;
  }
  if (typeof ArrayBuffer.isView === 'function') {
    return ArrayBuffer.isView(arrbuf);
  }
  if (!arrbuf) {
    return false;
  }
  if (arrbuf instanceof DataView) {
    return true;
  }
  if (arrbuf.buffer && arrbuf.buffer instanceof ArrayBuffer) {
    return true;
  }
  return false;
}
// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

var regex = /\s*function\s+([^\(\s]*)\s*/;
// based on https://github.com/ljharb/function.prototype.name/blob/adeeeec8bfcc6068b187d7d9fb3d5bb1d3a30899/implementation.js
function getName(func) {
  if (!util.isFunction(func)) {
    return;
  }
  if (functionsHaveNames) {
    return func.name;
  }
  var str = func.toString();
  var match = str.match(regex);
  return match && match[1];
}
assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  } else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = getName(stackStartFunction);
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function truncate(s, n) {
  if (typeof s === 'string') {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}
function inspect(something) {
  if (functionsHaveNames || !util.isFunction(something)) {
    return util.inspect(something);
  }
  var rawname = getName(something);
  var name = rawname ? ': ' + rawname : '';
  return '[Function' +  name + ']';
}
function getMessage(self) {
  return truncate(inspect(self.actual), 128) + ' ' +
         self.operator + ' ' +
         truncate(inspect(self.expected), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected, false)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

assert.deepStrictEqual = function deepStrictEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected, true)) {
    fail(actual, expected, message, 'deepStrictEqual', assert.deepStrictEqual);
  }
};

function _deepEqual(actual, expected, strict, memos) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;
  } else if (isBuffer(actual) && isBuffer(expected)) {
    return compare(actual, expected) === 0;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if ((actual === null || typeof actual !== 'object') &&
             (expected === null || typeof expected !== 'object')) {
    return strict ? actual === expected : actual == expected;

  // If both values are instances of typed arrays, wrap their underlying
  // ArrayBuffers in a Buffer each to increase performance
  // This optimization requires the arrays to have the same type as checked by
  // Object.prototype.toString (aka pToString). Never perform binary
  // comparisons for Float*Arrays, though, since e.g. +0 === -0 but their
  // bit patterns are not identical.
  } else if (isView(actual) && isView(expected) &&
             pToString(actual) === pToString(expected) &&
             !(actual instanceof Float32Array ||
               actual instanceof Float64Array)) {
    return compare(new Uint8Array(actual.buffer),
                   new Uint8Array(expected.buffer)) === 0;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else if (isBuffer(actual) !== isBuffer(expected)) {
    return false;
  } else {
    memos = memos || {actual: [], expected: []};

    var actualIndex = memos.actual.indexOf(actual);
    if (actualIndex !== -1) {
      if (actualIndex === memos.expected.indexOf(expected)) {
        return true;
      }
    }

    memos.actual.push(actual);
    memos.expected.push(expected);

    return objEquiv(actual, expected, strict, memos);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b, strict, actualVisitedObjects) {
  if (a === null || a === undefined || b === null || b === undefined)
    return false;
  // if one is a primitive, the other must be same
  if (util.isPrimitive(a) || util.isPrimitive(b))
    return a === b;
  if (strict && Object.getPrototypeOf(a) !== Object.getPrototypeOf(b))
    return false;
  var aIsArgs = isArguments(a);
  var bIsArgs = isArguments(b);
  if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
    return false;
  if (aIsArgs) {
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b, strict);
  }
  var ka = objectKeys(a);
  var kb = objectKeys(b);
  var key, i;
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length !== kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] !== kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key], strict, actualVisitedObjects))
      return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected, false)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

assert.notDeepStrictEqual = notDeepStrictEqual;
function notDeepStrictEqual(actual, expected, message) {
  if (_deepEqual(actual, expected, true)) {
    fail(actual, expected, message, 'notDeepStrictEqual', notDeepStrictEqual);
  }
}


// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  }

  try {
    if (actual instanceof expected) {
      return true;
    }
  } catch (e) {
    // Ignore.  The instanceof check doesn't work for arrow functions.
  }

  if (Error.isPrototypeOf(expected)) {
    return false;
  }

  return expected.call({}, actual) === true;
}

function _tryBlock(block) {
  var error;
  try {
    block();
  } catch (e) {
    error = e;
  }
  return error;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (typeof block !== 'function') {
    throw new TypeError('"block" argument must be a function');
  }

  if (typeof expected === 'string') {
    message = expected;
    expected = null;
  }

  actual = _tryBlock(block);

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  var userProvidedMessage = typeof message === 'string';
  var isUnwantedException = !shouldThrow && util.isError(actual);
  var isUnexpectedException = !shouldThrow && actual && !expected;

  if ((isUnwantedException &&
      userProvidedMessage &&
      expectedException(actual, expected)) ||
      isUnexpectedException) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws(true, block, error, message);
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/error, /*optional*/message) {
  _throws(false, block, error, message);
};

assert.ifError = function(err) { if (err) throw err; };

// Expose a strict only variant of assert
function strict(value, message) {
  if (!value) fail(value, true, message, '==', strict);
}
assert.strict = objectAssign(strict, assert, {
  equal: assert.strictEqual,
  deepEqual: assert.deepStrictEqual,
  notEqual: assert.notStrictEqual,
  notDeepEqual: assert.notDeepStrictEqual
});
assert.strict.strict = assert.strict;

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"object.assign/polyfill":68,"util/":41}],39:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],40:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],41:[function(require,module,exports){
(function (process,global){(function (){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this)}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":40,"_process":70,"inherits":39}],42:[function(require,module,exports){

},{}],43:[function(require,module,exports){
'use strict';

var GetIntrinsic = require('get-intrinsic');

var callBind = require('./');

var $indexOf = callBind(GetIntrinsic('String.prototype.indexOf'));

module.exports = function callBoundIntrinsic(name, allowMissing) {
	var intrinsic = GetIntrinsic(name, !!allowMissing);
	if (typeof intrinsic === 'function' && $indexOf(name, '.prototype.') > -1) {
		return callBind(intrinsic);
	}
	return intrinsic;
};

},{"./":44,"get-intrinsic":57}],44:[function(require,module,exports){
'use strict';

var bind = require('function-bind');
var GetIntrinsic = require('get-intrinsic');
var setFunctionLength = require('set-function-length');

var $TypeError = require('es-errors/type');
var $apply = GetIntrinsic('%Function.prototype.apply%');
var $call = GetIntrinsic('%Function.prototype.call%');
var $reflectApply = GetIntrinsic('%Reflect.apply%', true) || bind.call($call, $apply);

var $defineProperty = require('es-define-property');
var $max = GetIntrinsic('%Math.max%');

module.exports = function callBind(originalFunction) {
	if (typeof originalFunction !== 'function') {
		throw new $TypeError('a function is required');
	}
	var func = $reflectApply(bind, $call, arguments);
	return setFunctionLength(
		func,
		1 + $max(0, originalFunction.length - (arguments.length - 1)),
		true
	);
};

var applyBind = function applyBind() {
	return $reflectApply(bind, $apply, arguments);
};

if ($defineProperty) {
	$defineProperty(module.exports, 'apply', { value: applyBind });
} else {
	module.exports.apply = applyBind;
}

},{"es-define-property":47,"es-errors/type":53,"function-bind":56,"get-intrinsic":57,"set-function-length":71}],45:[function(require,module,exports){
(function (global){(function (){
/*global window, global*/
var util = require("util")
var assert = require("assert")
function now() { return new Date().getTime() }

var slice = Array.prototype.slice
var console
var times = {}

if (typeof global !== "undefined" && global.console) {
    console = global.console
} else if (typeof window !== "undefined" && window.console) {
    console = window.console
} else {
    console = {}
}

var functions = [
    [log, "log"],
    [info, "info"],
    [warn, "warn"],
    [error, "error"],
    [time, "time"],
    [timeEnd, "timeEnd"],
    [trace, "trace"],
    [dir, "dir"],
    [consoleAssert, "assert"]
]

for (var i = 0; i < functions.length; i++) {
    var tuple = functions[i]
    var f = tuple[0]
    var name = tuple[1]

    if (!console[name]) {
        console[name] = f
    }
}

module.exports = console

function log() {}

function info() {
    console.log.apply(console, arguments)
}

function warn() {
    console.log.apply(console, arguments)
}

function error() {
    console.warn.apply(console, arguments)
}

function time(label) {
    times[label] = now()
}

function timeEnd(label) {
    var time = times[label]
    if (!time) {
        throw new Error("No such label: " + label)
    }

    delete times[label]
    var duration = now() - time
    console.log(label + ": " + duration + "ms")
}

function trace() {
    var err = new Error()
    err.name = "Trace"
    err.message = util.format.apply(null, arguments)
    console.error(err.stack)
}

function dir(object) {
    console.log(util.inspect(object) + "\n")
}

function consoleAssert(expression) {
    if (!expression) {
        var arr = slice.call(arguments, 1)
        assert.ok(false, util.format.apply(null, arr))
    }
}

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"assert":38,"util":42}],46:[function(require,module,exports){
'use strict';

var $defineProperty = require('es-define-property');

var $SyntaxError = require('es-errors/syntax');
var $TypeError = require('es-errors/type');

var gopd = require('gopd');

/** @type {import('.')} */
module.exports = function defineDataProperty(
	obj,
	property,
	value
) {
	if (!obj || (typeof obj !== 'object' && typeof obj !== 'function')) {
		throw new $TypeError('`obj` must be an object or a function`');
	}
	if (typeof property !== 'string' && typeof property !== 'symbol') {
		throw new $TypeError('`property` must be a string or a symbol`');
	}
	if (arguments.length > 3 && typeof arguments[3] !== 'boolean' && arguments[3] !== null) {
		throw new $TypeError('`nonEnumerable`, if provided, must be a boolean or null');
	}
	if (arguments.length > 4 && typeof arguments[4] !== 'boolean' && arguments[4] !== null) {
		throw new $TypeError('`nonWritable`, if provided, must be a boolean or null');
	}
	if (arguments.length > 5 && typeof arguments[5] !== 'boolean' && arguments[5] !== null) {
		throw new $TypeError('`nonConfigurable`, if provided, must be a boolean or null');
	}
	if (arguments.length > 6 && typeof arguments[6] !== 'boolean') {
		throw new $TypeError('`loose`, if provided, must be a boolean');
	}

	var nonEnumerable = arguments.length > 3 ? arguments[3] : null;
	var nonWritable = arguments.length > 4 ? arguments[4] : null;
	var nonConfigurable = arguments.length > 5 ? arguments[5] : null;
	var loose = arguments.length > 6 ? arguments[6] : false;

	/* @type {false | TypedPropertyDescriptor<unknown>} */
	var desc = !!gopd && gopd(obj, property);

	if ($defineProperty) {
		$defineProperty(obj, property, {
			configurable: nonConfigurable === null && desc ? desc.configurable : !nonConfigurable,
			enumerable: nonEnumerable === null && desc ? desc.enumerable : !nonEnumerable,
			value: value,
			writable: nonWritable === null && desc ? desc.writable : !nonWritable
		});
	} else if (loose || (!nonEnumerable && !nonWritable && !nonConfigurable)) {
		// must fall back to [[Set]], and was not explicitly asked to make non-enumerable, non-writable, or non-configurable
		obj[property] = value; // eslint-disable-line no-param-reassign
	} else {
		throw new $SyntaxError('This environment does not support defining a property as non-configurable, non-writable, or non-enumerable.');
	}
};

},{"es-define-property":47,"es-errors/syntax":52,"es-errors/type":53,"gopd":58}],47:[function(require,module,exports){
'use strict';

var GetIntrinsic = require('get-intrinsic');

/** @type {import('.')} */
var $defineProperty = GetIntrinsic('%Object.defineProperty%', true) || false;
if ($defineProperty) {
	try {
		$defineProperty({}, 'a', { value: 1 });
	} catch (e) {
		// IE 8 has a broken defineProperty
		$defineProperty = false;
	}
}

module.exports = $defineProperty;

},{"get-intrinsic":57}],48:[function(require,module,exports){
'use strict';

/** @type {import('./eval')} */
module.exports = EvalError;

},{}],49:[function(require,module,exports){
'use strict';

/** @type {import('.')} */
module.exports = Error;

},{}],50:[function(require,module,exports){
'use strict';

/** @type {import('./range')} */
module.exports = RangeError;

},{}],51:[function(require,module,exports){
'use strict';

/** @type {import('./ref')} */
module.exports = ReferenceError;

},{}],52:[function(require,module,exports){
'use strict';

/** @type {import('./syntax')} */
module.exports = SyntaxError;

},{}],53:[function(require,module,exports){
'use strict';

/** @type {import('./type')} */
module.exports = TypeError;

},{}],54:[function(require,module,exports){
'use strict';

/** @type {import('./uri')} */
module.exports = URIError;

},{}],55:[function(require,module,exports){
'use strict';

/* eslint no-invalid-this: 1 */

var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
var toStr = Object.prototype.toString;
var max = Math.max;
var funcType = '[object Function]';

var concatty = function concatty(a, b) {
    var arr = [];

    for (var i = 0; i < a.length; i += 1) {
        arr[i] = a[i];
    }
    for (var j = 0; j < b.length; j += 1) {
        arr[j + a.length] = b[j];
    }

    return arr;
};

var slicy = function slicy(arrLike, offset) {
    var arr = [];
    for (var i = offset || 0, j = 0; i < arrLike.length; i += 1, j += 1) {
        arr[j] = arrLike[i];
    }
    return arr;
};

var joiny = function (arr, joiner) {
    var str = '';
    for (var i = 0; i < arr.length; i += 1) {
        str += arr[i];
        if (i + 1 < arr.length) {
            str += joiner;
        }
    }
    return str;
};

module.exports = function bind(that) {
    var target = this;
    if (typeof target !== 'function' || toStr.apply(target) !== funcType) {
        throw new TypeError(ERROR_MESSAGE + target);
    }
    var args = slicy(arguments, 1);

    var bound;
    var binder = function () {
        if (this instanceof bound) {
            var result = target.apply(
                this,
                concatty(args, arguments)
            );
            if (Object(result) === result) {
                return result;
            }
            return this;
        }
        return target.apply(
            that,
            concatty(args, arguments)
        );

    };

    var boundLength = max(0, target.length - args.length);
    var boundArgs = [];
    for (var i = 0; i < boundLength; i++) {
        boundArgs[i] = '$' + i;
    }

    bound = Function('binder', 'return function (' + joiny(boundArgs, ',') + '){ return binder.apply(this,arguments); }')(binder);

    if (target.prototype) {
        var Empty = function Empty() {};
        Empty.prototype = target.prototype;
        bound.prototype = new Empty();
        Empty.prototype = null;
    }

    return bound;
};

},{}],56:[function(require,module,exports){
'use strict';

var implementation = require('./implementation');

module.exports = Function.prototype.bind || implementation;

},{"./implementation":55}],57:[function(require,module,exports){
'use strict';

var undefined;

var $Error = require('es-errors');
var $EvalError = require('es-errors/eval');
var $RangeError = require('es-errors/range');
var $ReferenceError = require('es-errors/ref');
var $SyntaxError = require('es-errors/syntax');
var $TypeError = require('es-errors/type');
var $URIError = require('es-errors/uri');

var $Function = Function;

// eslint-disable-next-line consistent-return
var getEvalledConstructor = function (expressionSyntax) {
	try {
		return $Function('"use strict"; return (' + expressionSyntax + ').constructor;')();
	} catch (e) {}
};

var $gOPD = Object.getOwnPropertyDescriptor;
if ($gOPD) {
	try {
		$gOPD({}, '');
	} catch (e) {
		$gOPD = null; // this is IE 8, which has a broken gOPD
	}
}

var throwTypeError = function () {
	throw new $TypeError();
};
var ThrowTypeError = $gOPD
	? (function () {
		try {
			// eslint-disable-next-line no-unused-expressions, no-caller, no-restricted-properties
			arguments.callee; // IE 8 does not throw here
			return throwTypeError;
		} catch (calleeThrows) {
			try {
				// IE 8 throws on Object.getOwnPropertyDescriptor(arguments, '')
				return $gOPD(arguments, 'callee').get;
			} catch (gOPDthrows) {
				return throwTypeError;
			}
		}
	}())
	: throwTypeError;

var hasSymbols = require('has-symbols')();
var hasProto = require('has-proto')();

var getProto = Object.getPrototypeOf || (
	hasProto
		? function (x) { return x.__proto__; } // eslint-disable-line no-proto
		: null
);

var needsEval = {};

var TypedArray = typeof Uint8Array === 'undefined' || !getProto ? undefined : getProto(Uint8Array);

var INTRINSICS = {
	__proto__: null,
	'%AggregateError%': typeof AggregateError === 'undefined' ? undefined : AggregateError,
	'%Array%': Array,
	'%ArrayBuffer%': typeof ArrayBuffer === 'undefined' ? undefined : ArrayBuffer,
	'%ArrayIteratorPrototype%': hasSymbols && getProto ? getProto([][Symbol.iterator]()) : undefined,
	'%AsyncFromSyncIteratorPrototype%': undefined,
	'%AsyncFunction%': needsEval,
	'%AsyncGenerator%': needsEval,
	'%AsyncGeneratorFunction%': needsEval,
	'%AsyncIteratorPrototype%': needsEval,
	'%Atomics%': typeof Atomics === 'undefined' ? undefined : Atomics,
	'%BigInt%': typeof BigInt === 'undefined' ? undefined : BigInt,
	'%BigInt64Array%': typeof BigInt64Array === 'undefined' ? undefined : BigInt64Array,
	'%BigUint64Array%': typeof BigUint64Array === 'undefined' ? undefined : BigUint64Array,
	'%Boolean%': Boolean,
	'%DataView%': typeof DataView === 'undefined' ? undefined : DataView,
	'%Date%': Date,
	'%decodeURI%': decodeURI,
	'%decodeURIComponent%': decodeURIComponent,
	'%encodeURI%': encodeURI,
	'%encodeURIComponent%': encodeURIComponent,
	'%Error%': $Error,
	'%eval%': eval, // eslint-disable-line no-eval
	'%EvalError%': $EvalError,
	'%Float32Array%': typeof Float32Array === 'undefined' ? undefined : Float32Array,
	'%Float64Array%': typeof Float64Array === 'undefined' ? undefined : Float64Array,
	'%FinalizationRegistry%': typeof FinalizationRegistry === 'undefined' ? undefined : FinalizationRegistry,
	'%Function%': $Function,
	'%GeneratorFunction%': needsEval,
	'%Int8Array%': typeof Int8Array === 'undefined' ? undefined : Int8Array,
	'%Int16Array%': typeof Int16Array === 'undefined' ? undefined : Int16Array,
	'%Int32Array%': typeof Int32Array === 'undefined' ? undefined : Int32Array,
	'%isFinite%': isFinite,
	'%isNaN%': isNaN,
	'%IteratorPrototype%': hasSymbols && getProto ? getProto(getProto([][Symbol.iterator]())) : undefined,
	'%JSON%': typeof JSON === 'object' ? JSON : undefined,
	'%Map%': typeof Map === 'undefined' ? undefined : Map,
	'%MapIteratorPrototype%': typeof Map === 'undefined' || !hasSymbols || !getProto ? undefined : getProto(new Map()[Symbol.iterator]()),
	'%Math%': Math,
	'%Number%': Number,
	'%Object%': Object,
	'%parseFloat%': parseFloat,
	'%parseInt%': parseInt,
	'%Promise%': typeof Promise === 'undefined' ? undefined : Promise,
	'%Proxy%': typeof Proxy === 'undefined' ? undefined : Proxy,
	'%RangeError%': $RangeError,
	'%ReferenceError%': $ReferenceError,
	'%Reflect%': typeof Reflect === 'undefined' ? undefined : Reflect,
	'%RegExp%': RegExp,
	'%Set%': typeof Set === 'undefined' ? undefined : Set,
	'%SetIteratorPrototype%': typeof Set === 'undefined' || !hasSymbols || !getProto ? undefined : getProto(new Set()[Symbol.iterator]()),
	'%SharedArrayBuffer%': typeof SharedArrayBuffer === 'undefined' ? undefined : SharedArrayBuffer,
	'%String%': String,
	'%StringIteratorPrototype%': hasSymbols && getProto ? getProto(''[Symbol.iterator]()) : undefined,
	'%Symbol%': hasSymbols ? Symbol : undefined,
	'%SyntaxError%': $SyntaxError,
	'%ThrowTypeError%': ThrowTypeError,
	'%TypedArray%': TypedArray,
	'%TypeError%': $TypeError,
	'%Uint8Array%': typeof Uint8Array === 'undefined' ? undefined : Uint8Array,
	'%Uint8ClampedArray%': typeof Uint8ClampedArray === 'undefined' ? undefined : Uint8ClampedArray,
	'%Uint16Array%': typeof Uint16Array === 'undefined' ? undefined : Uint16Array,
	'%Uint32Array%': typeof Uint32Array === 'undefined' ? undefined : Uint32Array,
	'%URIError%': $URIError,
	'%WeakMap%': typeof WeakMap === 'undefined' ? undefined : WeakMap,
	'%WeakRef%': typeof WeakRef === 'undefined' ? undefined : WeakRef,
	'%WeakSet%': typeof WeakSet === 'undefined' ? undefined : WeakSet
};

if (getProto) {
	try {
		null.error; // eslint-disable-line no-unused-expressions
	} catch (e) {
		// https://github.com/tc39/proposal-shadowrealm/pull/384#issuecomment-1364264229
		var errorProto = getProto(getProto(e));
		INTRINSICS['%Error.prototype%'] = errorProto;
	}
}

var doEval = function doEval(name) {
	var value;
	if (name === '%AsyncFunction%') {
		value = getEvalledConstructor('async function () {}');
	} else if (name === '%GeneratorFunction%') {
		value = getEvalledConstructor('function* () {}');
	} else if (name === '%AsyncGeneratorFunction%') {
		value = getEvalledConstructor('async function* () {}');
	} else if (name === '%AsyncGenerator%') {
		var fn = doEval('%AsyncGeneratorFunction%');
		if (fn) {
			value = fn.prototype;
		}
	} else if (name === '%AsyncIteratorPrototype%') {
		var gen = doEval('%AsyncGenerator%');
		if (gen && getProto) {
			value = getProto(gen.prototype);
		}
	}

	INTRINSICS[name] = value;

	return value;
};

var LEGACY_ALIASES = {
	__proto__: null,
	'%ArrayBufferPrototype%': ['ArrayBuffer', 'prototype'],
	'%ArrayPrototype%': ['Array', 'prototype'],
	'%ArrayProto_entries%': ['Array', 'prototype', 'entries'],
	'%ArrayProto_forEach%': ['Array', 'prototype', 'forEach'],
	'%ArrayProto_keys%': ['Array', 'prototype', 'keys'],
	'%ArrayProto_values%': ['Array', 'prototype', 'values'],
	'%AsyncFunctionPrototype%': ['AsyncFunction', 'prototype'],
	'%AsyncGenerator%': ['AsyncGeneratorFunction', 'prototype'],
	'%AsyncGeneratorPrototype%': ['AsyncGeneratorFunction', 'prototype', 'prototype'],
	'%BooleanPrototype%': ['Boolean', 'prototype'],
	'%DataViewPrototype%': ['DataView', 'prototype'],
	'%DatePrototype%': ['Date', 'prototype'],
	'%ErrorPrototype%': ['Error', 'prototype'],
	'%EvalErrorPrototype%': ['EvalError', 'prototype'],
	'%Float32ArrayPrototype%': ['Float32Array', 'prototype'],
	'%Float64ArrayPrototype%': ['Float64Array', 'prototype'],
	'%FunctionPrototype%': ['Function', 'prototype'],
	'%Generator%': ['GeneratorFunction', 'prototype'],
	'%GeneratorPrototype%': ['GeneratorFunction', 'prototype', 'prototype'],
	'%Int8ArrayPrototype%': ['Int8Array', 'prototype'],
	'%Int16ArrayPrototype%': ['Int16Array', 'prototype'],
	'%Int32ArrayPrototype%': ['Int32Array', 'prototype'],
	'%JSONParse%': ['JSON', 'parse'],
	'%JSONStringify%': ['JSON', 'stringify'],
	'%MapPrototype%': ['Map', 'prototype'],
	'%NumberPrototype%': ['Number', 'prototype'],
	'%ObjectPrototype%': ['Object', 'prototype'],
	'%ObjProto_toString%': ['Object', 'prototype', 'toString'],
	'%ObjProto_valueOf%': ['Object', 'prototype', 'valueOf'],
	'%PromisePrototype%': ['Promise', 'prototype'],
	'%PromiseProto_then%': ['Promise', 'prototype', 'then'],
	'%Promise_all%': ['Promise', 'all'],
	'%Promise_reject%': ['Promise', 'reject'],
	'%Promise_resolve%': ['Promise', 'resolve'],
	'%RangeErrorPrototype%': ['RangeError', 'prototype'],
	'%ReferenceErrorPrototype%': ['ReferenceError', 'prototype'],
	'%RegExpPrototype%': ['RegExp', 'prototype'],
	'%SetPrototype%': ['Set', 'prototype'],
	'%SharedArrayBufferPrototype%': ['SharedArrayBuffer', 'prototype'],
	'%StringPrototype%': ['String', 'prototype'],
	'%SymbolPrototype%': ['Symbol', 'prototype'],
	'%SyntaxErrorPrototype%': ['SyntaxError', 'prototype'],
	'%TypedArrayPrototype%': ['TypedArray', 'prototype'],
	'%TypeErrorPrototype%': ['TypeError', 'prototype'],
	'%Uint8ArrayPrototype%': ['Uint8Array', 'prototype'],
	'%Uint8ClampedArrayPrototype%': ['Uint8ClampedArray', 'prototype'],
	'%Uint16ArrayPrototype%': ['Uint16Array', 'prototype'],
	'%Uint32ArrayPrototype%': ['Uint32Array', 'prototype'],
	'%URIErrorPrototype%': ['URIError', 'prototype'],
	'%WeakMapPrototype%': ['WeakMap', 'prototype'],
	'%WeakSetPrototype%': ['WeakSet', 'prototype']
};

var bind = require('function-bind');
var hasOwn = require('hasown');
var $concat = bind.call(Function.call, Array.prototype.concat);
var $spliceApply = bind.call(Function.apply, Array.prototype.splice);
var $replace = bind.call(Function.call, String.prototype.replace);
var $strSlice = bind.call(Function.call, String.prototype.slice);
var $exec = bind.call(Function.call, RegExp.prototype.exec);

/* adapted from https://github.com/lodash/lodash/blob/4.17.15/dist/lodash.js#L6735-L6744 */
var rePropName = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
var reEscapeChar = /\\(\\)?/g; /** Used to match backslashes in property paths. */
var stringToPath = function stringToPath(string) {
	var first = $strSlice(string, 0, 1);
	var last = $strSlice(string, -1);
	if (first === '%' && last !== '%') {
		throw new $SyntaxError('invalid intrinsic syntax, expected closing `%`');
	} else if (last === '%' && first !== '%') {
		throw new $SyntaxError('invalid intrinsic syntax, expected opening `%`');
	}
	var result = [];
	$replace(string, rePropName, function (match, number, quote, subString) {
		result[result.length] = quote ? $replace(subString, reEscapeChar, '$1') : number || match;
	});
	return result;
};
/* end adaptation */

var getBaseIntrinsic = function getBaseIntrinsic(name, allowMissing) {
	var intrinsicName = name;
	var alias;
	if (hasOwn(LEGACY_ALIASES, intrinsicName)) {
		alias = LEGACY_ALIASES[intrinsicName];
		intrinsicName = '%' + alias[0] + '%';
	}

	if (hasOwn(INTRINSICS, intrinsicName)) {
		var value = INTRINSICS[intrinsicName];
		if (value === needsEval) {
			value = doEval(intrinsicName);
		}
		if (typeof value === 'undefined' && !allowMissing) {
			throw new $TypeError('intrinsic ' + name + ' exists, but is not available. Please file an issue!');
		}

		return {
			alias: alias,
			name: intrinsicName,
			value: value
		};
	}

	throw new $SyntaxError('intrinsic ' + name + ' does not exist!');
};

module.exports = function GetIntrinsic(name, allowMissing) {
	if (typeof name !== 'string' || name.length === 0) {
		throw new $TypeError('intrinsic name must be a non-empty string');
	}
	if (arguments.length > 1 && typeof allowMissing !== 'boolean') {
		throw new $TypeError('"allowMissing" argument must be a boolean');
	}

	if ($exec(/^%?[^%]*%?$/, name) === null) {
		throw new $SyntaxError('`%` may not be present anywhere but at the beginning and end of the intrinsic name');
	}
	var parts = stringToPath(name);
	var intrinsicBaseName = parts.length > 0 ? parts[0] : '';

	var intrinsic = getBaseIntrinsic('%' + intrinsicBaseName + '%', allowMissing);
	var intrinsicRealName = intrinsic.name;
	var value = intrinsic.value;
	var skipFurtherCaching = false;

	var alias = intrinsic.alias;
	if (alias) {
		intrinsicBaseName = alias[0];
		$spliceApply(parts, $concat([0, 1], alias));
	}

	for (var i = 1, isOwn = true; i < parts.length; i += 1) {
		var part = parts[i];
		var first = $strSlice(part, 0, 1);
		var last = $strSlice(part, -1);
		if (
			(
				(first === '"' || first === "'" || first === '`')
				|| (last === '"' || last === "'" || last === '`')
			)
			&& first !== last
		) {
			throw new $SyntaxError('property names with quotes must have matching quotes');
		}
		if (part === 'constructor' || !isOwn) {
			skipFurtherCaching = true;
		}

		intrinsicBaseName += '.' + part;
		intrinsicRealName = '%' + intrinsicBaseName + '%';

		if (hasOwn(INTRINSICS, intrinsicRealName)) {
			value = INTRINSICS[intrinsicRealName];
		} else if (value != null) {
			if (!(part in value)) {
				if (!allowMissing) {
					throw new $TypeError('base intrinsic for ' + name + ' exists, but the property is not available.');
				}
				return void undefined;
			}
			if ($gOPD && (i + 1) >= parts.length) {
				var desc = $gOPD(value, part);
				isOwn = !!desc;

				// By convention, when a data property is converted to an accessor
				// property to emulate a data property that does not suffer from
				// the override mistake, that accessor's getter is marked with
				// an `originalValue` property. Here, when we detect this, we
				// uphold the illusion by pretending to see that original data
				// property, i.e., returning the value rather than the getter
				// itself.
				if (isOwn && 'get' in desc && !('originalValue' in desc.get)) {
					value = desc.get;
				} else {
					value = value[part];
				}
			} else {
				isOwn = hasOwn(value, part);
				value = value[part];
			}

			if (isOwn && !skipFurtherCaching) {
				INTRINSICS[intrinsicRealName] = value;
			}
		}
	}
	return value;
};

},{"es-errors":49,"es-errors/eval":48,"es-errors/range":50,"es-errors/ref":51,"es-errors/syntax":52,"es-errors/type":53,"es-errors/uri":54,"function-bind":56,"has-proto":60,"has-symbols":61,"hasown":63}],58:[function(require,module,exports){
'use strict';

var GetIntrinsic = require('get-intrinsic');

var $gOPD = GetIntrinsic('%Object.getOwnPropertyDescriptor%', true);

if ($gOPD) {
	try {
		$gOPD([], 'length');
	} catch (e) {
		// IE 8 has a broken gOPD
		$gOPD = null;
	}
}

module.exports = $gOPD;

},{"get-intrinsic":57}],59:[function(require,module,exports){
'use strict';

var $defineProperty = require('es-define-property');

var hasPropertyDescriptors = function hasPropertyDescriptors() {
	return !!$defineProperty;
};

hasPropertyDescriptors.hasArrayLengthDefineBug = function hasArrayLengthDefineBug() {
	// node v0.6 has a bug where array lengths can be Set but not Defined
	if (!$defineProperty) {
		return null;
	}
	try {
		return $defineProperty([], 'length', { value: 1 }).length !== 1;
	} catch (e) {
		// In Firefox 4-22, defining length on an array throws an exception.
		return true;
	}
};

module.exports = hasPropertyDescriptors;

},{"es-define-property":47}],60:[function(require,module,exports){
'use strict';

var test = {
	__proto__: null,
	foo: {}
};

var $Object = Object;

/** @type {import('.')} */
module.exports = function hasProto() {
	// @ts-expect-error: TS errors on an inherited property for some reason
	return { __proto__: test }.foo === test.foo
		&& !(test instanceof $Object);
};

},{}],61:[function(require,module,exports){
'use strict';

var origSymbol = typeof Symbol !== 'undefined' && Symbol;
var hasSymbolSham = require('./shams');

module.exports = function hasNativeSymbols() {
	if (typeof origSymbol !== 'function') { return false; }
	if (typeof Symbol !== 'function') { return false; }
	if (typeof origSymbol('foo') !== 'symbol') { return false; }
	if (typeof Symbol('bar') !== 'symbol') { return false; }

	return hasSymbolSham();
};

},{"./shams":62}],62:[function(require,module,exports){
'use strict';

/* eslint complexity: [2, 18], max-statements: [2, 33] */
module.exports = function hasSymbols() {
	if (typeof Symbol !== 'function' || typeof Object.getOwnPropertySymbols !== 'function') { return false; }
	if (typeof Symbol.iterator === 'symbol') { return true; }

	var obj = {};
	var sym = Symbol('test');
	var symObj = Object(sym);
	if (typeof sym === 'string') { return false; }

	if (Object.prototype.toString.call(sym) !== '[object Symbol]') { return false; }
	if (Object.prototype.toString.call(symObj) !== '[object Symbol]') { return false; }

	// temp disabled per https://github.com/ljharb/object.assign/issues/17
	// if (sym instanceof Symbol) { return false; }
	// temp disabled per https://github.com/WebReflection/get-own-property-symbols/issues/4
	// if (!(symObj instanceof Symbol)) { return false; }

	// if (typeof Symbol.prototype.toString !== 'function') { return false; }
	// if (String(sym) !== Symbol.prototype.toString.call(sym)) { return false; }

	var symVal = 42;
	obj[sym] = symVal;
	for (sym in obj) { return false; } // eslint-disable-line no-restricted-syntax, no-unreachable-loop
	if (typeof Object.keys === 'function' && Object.keys(obj).length !== 0) { return false; }

	if (typeof Object.getOwnPropertyNames === 'function' && Object.getOwnPropertyNames(obj).length !== 0) { return false; }

	var syms = Object.getOwnPropertySymbols(obj);
	if (syms.length !== 1 || syms[0] !== sym) { return false; }

	if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) { return false; }

	if (typeof Object.getOwnPropertyDescriptor === 'function') {
		var descriptor = Object.getOwnPropertyDescriptor(obj, sym);
		if (descriptor.value !== symVal || descriptor.enumerable !== true) { return false; }
	}

	return true;
};

},{}],63:[function(require,module,exports){
'use strict';

var call = Function.prototype.call;
var $hasOwn = Object.prototype.hasOwnProperty;
var bind = require('function-bind');

/** @type {import('.')} */
module.exports = bind.call(call, $hasOwn);

},{"function-bind":56}],64:[function(require,module,exports){
'use strict';

var keysShim;
if (!Object.keys) {
	// modified from https://github.com/es-shims/es5-shim
	var has = Object.prototype.hasOwnProperty;
	var toStr = Object.prototype.toString;
	var isArgs = require('./isArguments'); // eslint-disable-line global-require
	var isEnumerable = Object.prototype.propertyIsEnumerable;
	var hasDontEnumBug = !isEnumerable.call({ toString: null }, 'toString');
	var hasProtoEnumBug = isEnumerable.call(function () {}, 'prototype');
	var dontEnums = [
		'toString',
		'toLocaleString',
		'valueOf',
		'hasOwnProperty',
		'isPrototypeOf',
		'propertyIsEnumerable',
		'constructor'
	];
	var equalsConstructorPrototype = function (o) {
		var ctor = o.constructor;
		return ctor && ctor.prototype === o;
	};
	var excludedKeys = {
		$applicationCache: true,
		$console: true,
		$external: true,
		$frame: true,
		$frameElement: true,
		$frames: true,
		$innerHeight: true,
		$innerWidth: true,
		$onmozfullscreenchange: true,
		$onmozfullscreenerror: true,
		$outerHeight: true,
		$outerWidth: true,
		$pageXOffset: true,
		$pageYOffset: true,
		$parent: true,
		$scrollLeft: true,
		$scrollTop: true,
		$scrollX: true,
		$scrollY: true,
		$self: true,
		$webkitIndexedDB: true,
		$webkitStorageInfo: true,
		$window: true
	};
	var hasAutomationEqualityBug = (function () {
		/* global window */
		if (typeof window === 'undefined') { return false; }
		for (var k in window) {
			try {
				if (!excludedKeys['$' + k] && has.call(window, k) && window[k] !== null && typeof window[k] === 'object') {
					try {
						equalsConstructorPrototype(window[k]);
					} catch (e) {
						return true;
					}
				}
			} catch (e) {
				return true;
			}
		}
		return false;
	}());
	var equalsConstructorPrototypeIfNotBuggy = function (o) {
		/* global window */
		if (typeof window === 'undefined' || !hasAutomationEqualityBug) {
			return equalsConstructorPrototype(o);
		}
		try {
			return equalsConstructorPrototype(o);
		} catch (e) {
			return false;
		}
	};

	keysShim = function keys(object) {
		var isObject = object !== null && typeof object === 'object';
		var isFunction = toStr.call(object) === '[object Function]';
		var isArguments = isArgs(object);
		var isString = isObject && toStr.call(object) === '[object String]';
		var theKeys = [];

		if (!isObject && !isFunction && !isArguments) {
			throw new TypeError('Object.keys called on a non-object');
		}

		var skipProto = hasProtoEnumBug && isFunction;
		if (isString && object.length > 0 && !has.call(object, 0)) {
			for (var i = 0; i < object.length; ++i) {
				theKeys.push(String(i));
			}
		}

		if (isArguments && object.length > 0) {
			for (var j = 0; j < object.length; ++j) {
				theKeys.push(String(j));
			}
		} else {
			for (var name in object) {
				if (!(skipProto && name === 'prototype') && has.call(object, name)) {
					theKeys.push(String(name));
				}
			}
		}

		if (hasDontEnumBug) {
			var skipConstructor = equalsConstructorPrototypeIfNotBuggy(object);

			for (var k = 0; k < dontEnums.length; ++k) {
				if (!(skipConstructor && dontEnums[k] === 'constructor') && has.call(object, dontEnums[k])) {
					theKeys.push(dontEnums[k]);
				}
			}
		}
		return theKeys;
	};
}
module.exports = keysShim;

},{"./isArguments":66}],65:[function(require,module,exports){
'use strict';

var slice = Array.prototype.slice;
var isArgs = require('./isArguments');

var origKeys = Object.keys;
var keysShim = origKeys ? function keys(o) { return origKeys(o); } : require('./implementation');

var originalKeys = Object.keys;

keysShim.shim = function shimObjectKeys() {
	if (Object.keys) {
		var keysWorksWithArguments = (function () {
			// Safari 5.0 bug
			var args = Object.keys(arguments);
			return args && args.length === arguments.length;
		}(1, 2));
		if (!keysWorksWithArguments) {
			Object.keys = function keys(object) { // eslint-disable-line func-name-matching
				if (isArgs(object)) {
					return originalKeys(slice.call(object));
				}
				return originalKeys(object);
			};
		}
	} else {
		Object.keys = keysShim;
	}
	return Object.keys || keysShim;
};

module.exports = keysShim;

},{"./implementation":64,"./isArguments":66}],66:[function(require,module,exports){
'use strict';

var toStr = Object.prototype.toString;

module.exports = function isArguments(value) {
	var str = toStr.call(value);
	var isArgs = str === '[object Arguments]';
	if (!isArgs) {
		isArgs = str !== '[object Array]' &&
			value !== null &&
			typeof value === 'object' &&
			typeof value.length === 'number' &&
			value.length >= 0 &&
			toStr.call(value.callee) === '[object Function]';
	}
	return isArgs;
};

},{}],67:[function(require,module,exports){
'use strict';

// modified from https://github.com/es-shims/es6-shim
var objectKeys = require('object-keys');
var hasSymbols = require('has-symbols/shams')();
var callBound = require('call-bind/callBound');
var toObject = Object;
var $push = callBound('Array.prototype.push');
var $propIsEnumerable = callBound('Object.prototype.propertyIsEnumerable');
var originalGetSymbols = hasSymbols ? Object.getOwnPropertySymbols : null;

// eslint-disable-next-line no-unused-vars
module.exports = function assign(target, source1) {
	if (target == null) { throw new TypeError('target must be an object'); }
	var to = toObject(target); // step 1
	if (arguments.length === 1) {
		return to; // step 2
	}
	for (var s = 1; s < arguments.length; ++s) {
		var from = toObject(arguments[s]); // step 3.a.i

		// step 3.a.ii:
		var keys = objectKeys(from);
		var getSymbols = hasSymbols && (Object.getOwnPropertySymbols || originalGetSymbols);
		if (getSymbols) {
			var syms = getSymbols(from);
			for (var j = 0; j < syms.length; ++j) {
				var key = syms[j];
				if ($propIsEnumerable(from, key)) {
					$push(keys, key);
				}
			}
		}

		// step 3.a.iii:
		for (var i = 0; i < keys.length; ++i) {
			var nextKey = keys[i];
			if ($propIsEnumerable(from, nextKey)) { // step 3.a.iii.2
				var propValue = from[nextKey]; // step 3.a.iii.2.a
				to[nextKey] = propValue; // step 3.a.iii.2.b
			}
		}
	}

	return to; // step 4
};

},{"call-bind/callBound":43,"has-symbols/shams":62,"object-keys":65}],68:[function(require,module,exports){
'use strict';

var implementation = require('./implementation');

var lacksProperEnumerationOrder = function () {
	if (!Object.assign) {
		return false;
	}
	/*
	 * v8, specifically in node 4.x, has a bug with incorrect property enumeration order
	 * note: this does not detect the bug unless there's 20 characters
	 */
	var str = 'abcdefghijklmnopqrst';
	var letters = str.split('');
	var map = {};
	for (var i = 0; i < letters.length; ++i) {
		map[letters[i]] = letters[i];
	}
	var obj = Object.assign({}, map);
	var actual = '';
	for (var k in obj) {
		actual += k;
	}
	return str !== actual;
};

var assignHasPendingExceptions = function () {
	if (!Object.assign || !Object.preventExtensions) {
		return false;
	}
	/*
	 * Firefox 37 still has "pending exception" logic in its Object.assign implementation,
	 * which is 72% slower than our shim, and Firefox 40's native implementation.
	 */
	var thrower = Object.preventExtensions({ 1: 2 });
	try {
		Object.assign(thrower, 'xy');
	} catch (e) {
		return thrower[1] === 'y';
	}
	return false;
};

module.exports = function getPolyfill() {
	if (!Object.assign) {
		return implementation;
	}
	if (lacksProperEnumerationOrder()) {
		return implementation;
	}
	if (assignHasPendingExceptions()) {
		return implementation;
	}
	return Object.assign;
};

},{"./implementation":67}],69:[function(require,module,exports){
(function (process){(function (){
// 'path' module extracted from Node.js v8.11.1 (only the posix part)
// transplited with Babel

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

function assertPath(path) {
  if (typeof path !== 'string') {
    throw new TypeError('Path must be a string. Received ' + JSON.stringify(path));
  }
}

// Resolves . and .. elements in a path with directory names
function normalizeStringPosix(path, allowAboveRoot) {
  var res = '';
  var lastSegmentLength = 0;
  var lastSlash = -1;
  var dots = 0;
  var code;
  for (var i = 0; i <= path.length; ++i) {
    if (i < path.length)
      code = path.charCodeAt(i);
    else if (code === 47 /*/*/)
      break;
    else
      code = 47 /*/*/;
    if (code === 47 /*/*/) {
      if (lastSlash === i - 1 || dots === 1) {
        // NOOP
      } else if (lastSlash !== i - 1 && dots === 2) {
        if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 /*.*/ || res.charCodeAt(res.length - 2) !== 46 /*.*/) {
          if (res.length > 2) {
            var lastSlashIndex = res.lastIndexOf('/');
            if (lastSlashIndex !== res.length - 1) {
              if (lastSlashIndex === -1) {
                res = '';
                lastSegmentLength = 0;
              } else {
                res = res.slice(0, lastSlashIndex);
                lastSegmentLength = res.length - 1 - res.lastIndexOf('/');
              }
              lastSlash = i;
              dots = 0;
              continue;
            }
          } else if (res.length === 2 || res.length === 1) {
            res = '';
            lastSegmentLength = 0;
            lastSlash = i;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          if (res.length > 0)
            res += '/..';
          else
            res = '..';
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0)
          res += '/' + path.slice(lastSlash + 1, i);
        else
          res = path.slice(lastSlash + 1, i);
        lastSegmentLength = i - lastSlash - 1;
      }
      lastSlash = i;
      dots = 0;
    } else if (code === 46 /*.*/ && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}

function _format(sep, pathObject) {
  var dir = pathObject.dir || pathObject.root;
  var base = pathObject.base || (pathObject.name || '') + (pathObject.ext || '');
  if (!dir) {
    return base;
  }
  if (dir === pathObject.root) {
    return dir + base;
  }
  return dir + sep + base;
}

var posix = {
  // path.resolve([from ...], to)
  resolve: function resolve() {
    var resolvedPath = '';
    var resolvedAbsolute = false;
    var cwd;

    for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
      var path;
      if (i >= 0)
        path = arguments[i];
      else {
        if (cwd === undefined)
          cwd = process.cwd();
        path = cwd;
      }

      assertPath(path);

      // Skip empty entries
      if (path.length === 0) {
        continue;
      }

      resolvedPath = path + '/' + resolvedPath;
      resolvedAbsolute = path.charCodeAt(0) === 47 /*/*/;
    }

    // At this point the path should be resolved to a full absolute path, but
    // handle relative paths to be safe (might happen when process.cwd() fails)

    // Normalize the path
    resolvedPath = normalizeStringPosix(resolvedPath, !resolvedAbsolute);

    if (resolvedAbsolute) {
      if (resolvedPath.length > 0)
        return '/' + resolvedPath;
      else
        return '/';
    } else if (resolvedPath.length > 0) {
      return resolvedPath;
    } else {
      return '.';
    }
  },

  normalize: function normalize(path) {
    assertPath(path);

    if (path.length === 0) return '.';

    var isAbsolute = path.charCodeAt(0) === 47 /*/*/;
    var trailingSeparator = path.charCodeAt(path.length - 1) === 47 /*/*/;

    // Normalize the path
    path = normalizeStringPosix(path, !isAbsolute);

    if (path.length === 0 && !isAbsolute) path = '.';
    if (path.length > 0 && trailingSeparator) path += '/';

    if (isAbsolute) return '/' + path;
    return path;
  },

  isAbsolute: function isAbsolute(path) {
    assertPath(path);
    return path.length > 0 && path.charCodeAt(0) === 47 /*/*/;
  },

  join: function join() {
    if (arguments.length === 0)
      return '.';
    var joined;
    for (var i = 0; i < arguments.length; ++i) {
      var arg = arguments[i];
      assertPath(arg);
      if (arg.length > 0) {
        if (joined === undefined)
          joined = arg;
        else
          joined += '/' + arg;
      }
    }
    if (joined === undefined)
      return '.';
    return posix.normalize(joined);
  },

  relative: function relative(from, to) {
    assertPath(from);
    assertPath(to);

    if (from === to) return '';

    from = posix.resolve(from);
    to = posix.resolve(to);

    if (from === to) return '';

    // Trim any leading backslashes
    var fromStart = 1;
    for (; fromStart < from.length; ++fromStart) {
      if (from.charCodeAt(fromStart) !== 47 /*/*/)
        break;
    }
    var fromEnd = from.length;
    var fromLen = fromEnd - fromStart;

    // Trim any leading backslashes
    var toStart = 1;
    for (; toStart < to.length; ++toStart) {
      if (to.charCodeAt(toStart) !== 47 /*/*/)
        break;
    }
    var toEnd = to.length;
    var toLen = toEnd - toStart;

    // Compare paths to find the longest common path from root
    var length = fromLen < toLen ? fromLen : toLen;
    var lastCommonSep = -1;
    var i = 0;
    for (; i <= length; ++i) {
      if (i === length) {
        if (toLen > length) {
          if (to.charCodeAt(toStart + i) === 47 /*/*/) {
            // We get here if `from` is the exact base path for `to`.
            // For example: from='/foo/bar'; to='/foo/bar/baz'
            return to.slice(toStart + i + 1);
          } else if (i === 0) {
            // We get here if `from` is the root
            // For example: from='/'; to='/foo'
            return to.slice(toStart + i);
          }
        } else if (fromLen > length) {
          if (from.charCodeAt(fromStart + i) === 47 /*/*/) {
            // We get here if `to` is the exact base path for `from`.
            // For example: from='/foo/bar/baz'; to='/foo/bar'
            lastCommonSep = i;
          } else if (i === 0) {
            // We get here if `to` is the root.
            // For example: from='/foo'; to='/'
            lastCommonSep = 0;
          }
        }
        break;
      }
      var fromCode = from.charCodeAt(fromStart + i);
      var toCode = to.charCodeAt(toStart + i);
      if (fromCode !== toCode)
        break;
      else if (fromCode === 47 /*/*/)
        lastCommonSep = i;
    }

    var out = '';
    // Generate the relative path based on the path difference between `to`
    // and `from`
    for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
      if (i === fromEnd || from.charCodeAt(i) === 47 /*/*/) {
        if (out.length === 0)
          out += '..';
        else
          out += '/..';
      }
    }

    // Lastly, append the rest of the destination (`to`) path that comes after
    // the common path parts
    if (out.length > 0)
      return out + to.slice(toStart + lastCommonSep);
    else {
      toStart += lastCommonSep;
      if (to.charCodeAt(toStart) === 47 /*/*/)
        ++toStart;
      return to.slice(toStart);
    }
  },

  _makeLong: function _makeLong(path) {
    return path;
  },

  dirname: function dirname(path) {
    assertPath(path);
    if (path.length === 0) return '.';
    var code = path.charCodeAt(0);
    var hasRoot = code === 47 /*/*/;
    var end = -1;
    var matchedSlash = true;
    for (var i = path.length - 1; i >= 1; --i) {
      code = path.charCodeAt(i);
      if (code === 47 /*/*/) {
          if (!matchedSlash) {
            end = i;
            break;
          }
        } else {
        // We saw the first non-path separator
        matchedSlash = false;
      }
    }

    if (end === -1) return hasRoot ? '/' : '.';
    if (hasRoot && end === 1) return '//';
    return path.slice(0, end);
  },

  basename: function basename(path, ext) {
    if (ext !== undefined && typeof ext !== 'string') throw new TypeError('"ext" argument must be a string');
    assertPath(path);

    var start = 0;
    var end = -1;
    var matchedSlash = true;
    var i;

    if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
      if (ext.length === path.length && ext === path) return '';
      var extIdx = ext.length - 1;
      var firstNonSlashEnd = -1;
      for (i = path.length - 1; i >= 0; --i) {
        var code = path.charCodeAt(i);
        if (code === 47 /*/*/) {
            // If we reached a path separator that was not part of a set of path
            // separators at the end of the string, stop now
            if (!matchedSlash) {
              start = i + 1;
              break;
            }
          } else {
          if (firstNonSlashEnd === -1) {
            // We saw the first non-path separator, remember this index in case
            // we need it if the extension ends up not matching
            matchedSlash = false;
            firstNonSlashEnd = i + 1;
          }
          if (extIdx >= 0) {
            // Try to match the explicit extension
            if (code === ext.charCodeAt(extIdx)) {
              if (--extIdx === -1) {
                // We matched the extension, so mark this as the end of our path
                // component
                end = i;
              }
            } else {
              // Extension does not match, so our result is the entire path
              // component
              extIdx = -1;
              end = firstNonSlashEnd;
            }
          }
        }
      }

      if (start === end) end = firstNonSlashEnd;else if (end === -1) end = path.length;
      return path.slice(start, end);
    } else {
      for (i = path.length - 1; i >= 0; --i) {
        if (path.charCodeAt(i) === 47 /*/*/) {
            // If we reached a path separator that was not part of a set of path
            // separators at the end of the string, stop now
            if (!matchedSlash) {
              start = i + 1;
              break;
            }
          } else if (end === -1) {
          // We saw the first non-path separator, mark this as the end of our
          // path component
          matchedSlash = false;
          end = i + 1;
        }
      }

      if (end === -1) return '';
      return path.slice(start, end);
    }
  },

  extname: function extname(path) {
    assertPath(path);
    var startDot = -1;
    var startPart = 0;
    var end = -1;
    var matchedSlash = true;
    // Track the state of characters (if any) we see before our first dot and
    // after any path separator we find
    var preDotState = 0;
    for (var i = path.length - 1; i >= 0; --i) {
      var code = path.charCodeAt(i);
      if (code === 47 /*/*/) {
          // If we reached a path separator that was not part of a set of path
          // separators at the end of the string, stop now
          if (!matchedSlash) {
            startPart = i + 1;
            break;
          }
          continue;
        }
      if (end === -1) {
        // We saw the first non-path separator, mark this as the end of our
        // extension
        matchedSlash = false;
        end = i + 1;
      }
      if (code === 46 /*.*/) {
          // If this is our first dot, mark it as the start of our extension
          if (startDot === -1)
            startDot = i;
          else if (preDotState !== 1)
            preDotState = 1;
      } else if (startDot !== -1) {
        // We saw a non-dot and non-path separator before our dot, so we should
        // have a good chance at having a non-empty extension
        preDotState = -1;
      }
    }

    if (startDot === -1 || end === -1 ||
        // We saw a non-dot character immediately before the dot
        preDotState === 0 ||
        // The (right-most) trimmed path component is exactly '..'
        preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
      return '';
    }
    return path.slice(startDot, end);
  },

  format: function format(pathObject) {
    if (pathObject === null || typeof pathObject !== 'object') {
      throw new TypeError('The "pathObject" argument must be of type Object. Received type ' + typeof pathObject);
    }
    return _format('/', pathObject);
  },

  parse: function parse(path) {
    assertPath(path);

    var ret = { root: '', dir: '', base: '', ext: '', name: '' };
    if (path.length === 0) return ret;
    var code = path.charCodeAt(0);
    var isAbsolute = code === 47 /*/*/;
    var start;
    if (isAbsolute) {
      ret.root = '/';
      start = 1;
    } else {
      start = 0;
    }
    var startDot = -1;
    var startPart = 0;
    var end = -1;
    var matchedSlash = true;
    var i = path.length - 1;

    // Track the state of characters (if any) we see before our first dot and
    // after any path separator we find
    var preDotState = 0;

    // Get non-dir info
    for (; i >= start; --i) {
      code = path.charCodeAt(i);
      if (code === 47 /*/*/) {
          // If we reached a path separator that was not part of a set of path
          // separators at the end of the string, stop now
          if (!matchedSlash) {
            startPart = i + 1;
            break;
          }
          continue;
        }
      if (end === -1) {
        // We saw the first non-path separator, mark this as the end of our
        // extension
        matchedSlash = false;
        end = i + 1;
      }
      if (code === 46 /*.*/) {
          // If this is our first dot, mark it as the start of our extension
          if (startDot === -1) startDot = i;else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
        // We saw a non-dot and non-path separator before our dot, so we should
        // have a good chance at having a non-empty extension
        preDotState = -1;
      }
    }

    if (startDot === -1 || end === -1 ||
    // We saw a non-dot character immediately before the dot
    preDotState === 0 ||
    // The (right-most) trimmed path component is exactly '..'
    preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
      if (end !== -1) {
        if (startPart === 0 && isAbsolute) ret.base = ret.name = path.slice(1, end);else ret.base = ret.name = path.slice(startPart, end);
      }
    } else {
      if (startPart === 0 && isAbsolute) {
        ret.name = path.slice(1, startDot);
        ret.base = path.slice(1, end);
      } else {
        ret.name = path.slice(startPart, startDot);
        ret.base = path.slice(startPart, end);
      }
      ret.ext = path.slice(startDot, end);
    }

    if (startPart > 0) ret.dir = path.slice(0, startPart - 1);else if (isAbsolute) ret.dir = '/';

    return ret;
  },

  sep: '/',
  delimiter: ':',
  win32: null,
  posix: null
};

posix.posix = posix;

module.exports = posix;

}).call(this)}).call(this,require('_process'))
},{"_process":70}],70:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],71:[function(require,module,exports){
'use strict';

var GetIntrinsic = require('get-intrinsic');
var define = require('define-data-property');
var hasDescriptors = require('has-property-descriptors')();
var gOPD = require('gopd');

var $TypeError = require('es-errors/type');
var $floor = GetIntrinsic('%Math.floor%');

/** @type {import('.')} */
module.exports = function setFunctionLength(fn, length) {
	if (typeof fn !== 'function') {
		throw new $TypeError('`fn` is not a function');
	}
	if (typeof length !== 'number' || length < 0 || length > 0xFFFFFFFF || $floor(length) !== length) {
		throw new $TypeError('`length` must be a positive 32-bit integer');
	}

	var loose = arguments.length > 2 && !!arguments[2];

	var functionLengthIsConfigurable = true;
	var functionLengthIsWritable = true;
	if ('length' in fn && gOPD) {
		var desc = gOPD(fn, 'length');
		if (desc && !desc.configurable) {
			functionLengthIsConfigurable = false;
		}
		if (desc && !desc.writable) {
			functionLengthIsWritable = false;
		}
	}

	if (functionLengthIsConfigurable || functionLengthIsWritable || !loose) {
		if (hasDescriptors) {
			define(/** @type {Parameters<define>[0]} */ (fn), 'length', length, true, true);
		} else {
			define(/** @type {Parameters<define>[0]} */ (fn), 'length', length);
		}
	}
	return fn;
};

},{"define-data-property":46,"es-errors/type":53,"get-intrinsic":57,"gopd":58,"has-property-descriptors":59}],72:[function(require,module,exports){
// Run: npm run test-web

// A quick and dirty abomination to partially run the unit tests inside an
// actual browser by simulating some of the Jest API.

const Jester = (window.Jester = {
  exclude: [],
  state: {
    describe: {},
    unit: {},
    fail: {},
  },
})

// Ensure keys are sorted when JSONified.
function stringify(o) {
  if (null === o) return 'null'
  if ('symbol' === typeof o) return String(o)
  if ('object' !== typeof o) return '' + o
  return JSON.stringify(
    Object.keys(o)
      .sort()
      .reduce((a, k) => ((a[k] = o[k]), a), {}),
    stringify,
  ) // Recusively!
}

function print(s) {
  let test = document.getElementById('test')
  test.innerHTML = test.innerHTML + s + '<br>'
}

window.describe = function (name, tests) {
  Jester.state.describe = { name }
  tests()
}
window.test = function (name, unit) {
  if (Jester.exclude.includes(name)) return

  try {
    Jester.state.unit = { name }
    unit()
    print('PASS: ' + name)
  } catch (e) {
    console.log(e)
    print('FAIL: ' + name)
    print(e.message + '<br><pre>' + e.stack + '</pre>')
  }
}
window.it = window.test

window.expect = function (sval) {
  function pass(cval, ok) {
    if (!ok) {
      let state = Jester.state
      state.fail.found = sval
      state.fail.expected = cval
      let err = new Error(
        'FAIL: ' + state.describe.name + ' ' + state.unit.name,
      )
      throw err
    }
  }

  function passEqualJSON(cval) {
    let sjson = stringify(sval)
    let cjson = stringify(cval)

    let ok = sjson === cjson
    pass(cval, ok)
  }

  return {
    toBeTruthy: () => pass(sval, !!sval),
    toBeFalsy: () => pass(sval, !sval),

    toEqual: (cval) => {
      passEqualJSON(cval)
    },
    toBeDefined: (cval) => pass(cval, undefined !== sval),
    toBeUndefined: (cval) => pass(cval, undefined === sval),
    toMatch: (cval) => pass(cval, sval.match(cval)),
    toThrow: (cval) => {
      try {
        sval()
        pass(cval, false)
      } catch (e) {
        pass(cval, true)
      }
    },
    toMatchObject: (cval) => {
      passEqualJSON(cval)
    },
  }
}

require('../dist/test/aontu.test.js')
require('../dist/test/lang.test.js')
require('../dist/test/op.test.js')
require('../dist/test/unify.test.js')
require('../dist/test/val.test.js')
require('../dist/test/val-ref.test.js')
require('../dist/test/val-conjunct.test.js')
require('../dist/test/val-disjunct.test.js')

},{"../dist/test/aontu.test.js":19,"../dist/test/lang.test.js":20,"../dist/test/op.test.js":21,"../dist/test/unify.test.js":22,"../dist/test/val-conjunct.test.js":23,"../dist/test/val-disjunct.test.js":24,"../dist/test/val-ref.test.js":25,"../dist/test/val.test.js":26}]},{},[72]);
