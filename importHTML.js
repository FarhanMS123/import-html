/**
 * importHTML V1.0.0
 * functions : importHTML, importScript
 */

function mainImporter(func, src, async, forceReload, onreadystatechange){
	if(typeof func.srcList != "object" || func.srcList.constructor != Array) func.srcList = [];
	if(func.srcList.indexOf(src) > -1 && forceReload==false){
		if(typeof async == "function") async(false);
		return false;
	}
	func.srcList.push(src);

	var lastSrc = src;
	function updatedSource(upSrc){
		if(upSrc.indexOf("//") > -1 && upSrc.indexOf("//") < upSrc.indexOf("?")){ // https://example.com/lorum.js
			upSrc = upSrc;
		}else if(upSrc.slice(0,1) == "/"){ // /dir1/dir2/file.js
			upSrc = upSrc
		}else if(lastSrc.slice(-1,1) == "/"){ // /dir1/dir2/ + file.js -> /dir1/dir2/file.js
			upSrc = lastSrc + (upSrc.substr(0,2) == "./" ? upSrc.slice(2) : upSrc);
		}else{ // /dir1/dir2/file1.js + file2.js -> /dir1/dir2/file2.js
			upSrc = lastSrc.slice(0, lastSrc.lastIndexOf("/") + 1) + (upSrc.substr(0,2) == "./" ? upSrc.slice(2) : upSrc);
		}
		return upSrc;
	}
	function updatedImportScript(upSrc, upAsync=true, upForceReload=false){
		return importScript(updatedSource(upSrc), upAsync, upForceReload);
	}
	function updatedImportHTML(upSrc, upAsync=true, upForceReload=false){
		return importHTML(updatedSource(upSrc), upAsync, upForceReload);
	}

	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function(ev) {
		if (xhr.readyState == 4 && xhr.status == 200) {
			ev.xhr = xhr;
			ev.updatedImportScript = updatedImportScript;
			ev.updatedImportHTML = updatedImportHTML;

			onreadystatechange(ev);
		}
	};
	xhr.open("GET", src, async ? true : false);
	xhr.send();
	if(!async) return xhr.onreadystatechange();
}

function importScript(src, async=true, forceReload=false){
	mainImporter(importScript, src, async, forceReload, function(ev){
		var xhr=ev.xhr;
		var importScript = ev.updatedImportScript;
		var importHTML = ev.updatedImportHTML;

		eval(xhr.responseText);
		if(typeof async == "function") async();
	});
}
function importHTML(src, async=true, forceReload=false){
	mainImporter(importHTML, src, async, forceReload, function(ev){
		var xhr=ev.xhr;
		var importScript = ev.updatedImportScript;
		var importHTML = ev.updatedImportHTML;

		var nDiv = document.createElement("div"); nDiv.innerHTML = xhr.responseText;
		var template_html = nDiv.querySelectorAll("div")[0];
		var script = nDiv.querySelectorAll("script")[0].innerHTML;

		var tagName = template_html.tagName = template_html.getAttribute("tag-name"),
			exportType = template_html.exportType = template_html.getAttribute("export-type") || "custom-element",
			useShadowRoot = template_html.useShadowRoot = template_html.getAttribute("use-shadowRoot") == null ? true : eval(template_html.getAttribute("use-shadowRoot"));
		
		class customElement extends HTMLElement{
			constructor(){
				var el_super = super();
				var el_this = this;

				setTimeout(function(){
					if(typeof el_this.beforeCompiled == "function") el_this.beforeCompiled(el_super);

					var shadowRoot;
					if(exportType == "custom-element"){
						if(useShadowRoot){
							shadowRoot = el_super.attachShadow({mode: 'open'});
							shadowRoot.innerHTML = template_html.innerHTML;
						}else{
							el_super.innerHTML = template_html.innerHTML;
						}
					}else if(exportType == "inserted-element"){
						var nodesTemplate = template_html.children;
						var lastNodes = template_html.lastElementChild;

						el_super.parentElement.replaceChild(lastNodes, el_super);

						for(var i=nodesTemplate.length - 1; i>=0; i--){
							var lastNodes2 = nodesTemplate[i];
							lastNodes.parentElement.insertBefore(lastNodes2, lastNodes);
							lastNodes = lastNodes2;
						}
					}
					
					if(typeof el_this.compiled == "function") el_this.compiled(el_super, shadowRoot);
				},1);
			}
		}
		var func = new Function("template, importHTML, importScript, customElement", script);
		var newClass = func(template_html, importHTML, importScript, customElement);

		window.customElements.define(tagName, newClass);

		if(typeof async == "function") async(true);
		return true
	});
}

window.customElements.define("import-html", class extends HTMLElement{
	constructor(){
		var el_super = super();

		setTimeout(function(){
			var src = el_super.getAttribute("src");
			importHTML(src);
		},1);
	}
});