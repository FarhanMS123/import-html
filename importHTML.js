/**
 * I would use logic like ejs does.
 */

function importHTML(src, forceReload=false){
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4 && xhr.status == 200) {
			var resText = xhr.responseText;
			window.resText = resText;

			var nDiv = document.createElement("div");
			nDiv.innerHTML = resText;
			var template_html = nDiv.querySelectorAll("template")[0];
			var script = nDiv.querySelectorAll("script")[0].innerHTML;
			
			/*script += ";\r\n return template;";
			var func = new Function("template, importHTML", script);
			var scrathElement = document.createElement("div");;
			var template = {
				element: scrathElement,
				shadowRoot: scrathElement.attachShadow({mode: 'open'}),
				compiled: function(){}
			};
			template = func(template, importHTML);*/

			/* var func = new Function("template_html, importScript, importHTML", ` return class extends HTMLElement{
				constructor(){
					var el_super = super();
					setTimeout(function(){
						var shadowRoot = el_super.attachShadow({mode: 'open'});
						shadowRoot.innerHTML = template_html.innerHTML;

						if(typeof this.compiled == "function") this.compiled(element, shadowRoot);
					},1);
				}
				${script}
			};`); */

			class customElement extends HTMLElement{
				constructor(){
					var el_super = super();
					var el_this = this;

					setTimeout(function(){
						var shadowRoot = el_super.attachShadow({mode: 'open'});
						shadowRoot.innerHTML = template_html.innerHTML;
						
						if(typeof el_this.compiled == "function") el_this.compiled(el_super, shadowRoot);
					},1);
				}
			}
			var func = new Function("template, importHTML, importScript, customElement", script);
			var newClass = func(template_html, importHTML, importScript, customElement);

			window.customElements.define(template_html.getAttribute("tag-name"), newClass);
		}
	};
	xhr.open("GET", src, true);
	xhr.send();
}
function importScript(src, forceReload=false){
	return Promise(function(resolve, reject){
		try{
			if(typeof importScript.srcList != "object" || importScript.srcList.constructor == Array) importScript.srcList = [];
			if(importScript.srcList.indexOf(src) > -1 && forceReload==false) throw "e";
			importScript.srcList.push(src);
			var xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function() {
				if (xhr.readyState == 4 && xhr.status == 200) {
					// /dir4/dir/5/file3

					// file1
					// ./file2
					
					// /dir1/dir2/dir3
					// /dir1/dir2/dir3/file1
					// /dir1/dir2/file2

					// /dir1/dir2/dir3/
					// /dir1/dir2/dir3/file1
					// /dir1/dir2/dir3/file2

					var lastSrc = src.substr(-1,1) == "/" ? src : a.slice(0, a.lastIndexOf("/") + 1);
					function updatedImportScript(src){
						importScript(lastSrc + src, forceReload);
					}
					var func = new Function("importHTML, importScript", xhr.responseText)
					resolve(await func(importHTML, updatedImportScript));
				}
			};
			xhr.open("GET", src, true);
			xhr.send();
		}catch(e){
			reject(e);
		}
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