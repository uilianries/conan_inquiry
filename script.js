String.prototype.toTitleCase=function(){return this[0].toUpperCase()+this.substr(1);};var App={};App.templates={pkgResult:_.template($('#packageItemTemplate').html()),pkg:_.template($('#packageTemplate').html()),category:_.template($('#categoryTemplate').html()),remote:_.template($('#remoteTemplate').html()),menuItem:_.template($('#menuItemTemplate').html()),findingManyRemotes:_.template($('#findingManyRemotes').html())};App.setState=function(state){console.debug('New state:',state);if(state in App&&App[state].onEnter){App[state].onEnter();}
$('[data-state]').hide();$('[data-state='+state+']').show();scrollTo(0,0);if(state in App&&App[state].onEntered){App[state].onEntered();}};window.App=App;App.router=new Navigo(null,true,'#!');function searchHandler(params){App.setState('search');if(!params){params={query:''}}
App.search.showResultsForFilter(params.query);if(App.search.$input.val()!==params.query){App.router.pause();App.search.$input.val(params.query);App.router.resume();}}
App.router.on(function(){searchHandler({query:''});}).on({'search/:query':{as:'search',uses:searchHandler},'search':searchHandler,'package/:id':{as:'package',uses:function(params){App.setState('package');var pkgData=_.find(packages_data,function(pkg){return pkg.id===params.id;});App.package.$.html(App.templates.pkg(pkgData));timeago().render(App.package.$.find('.timeago'));App.package.$.find('pre > code').each(function(i,block){hljs.highlightBlock(block);});var versionSelector=App.package.$.find('.version-selector');App.package.updateCurrentVersion(versionSelector);versionSelector.on('change input',function(evt){App.package.updateCurrentVersion(evt.target);});}},'category/:name':{as:'category',uses:function(params){App.setState('category');var subcats=_.filter(App.category.allUnique,function(c){var a=c.split('.');var b=params.name.split('.');return c.startsWith(params.name+'.')&&a.length===b.length+1;});if(params.name.startsWith('standard.')){subcats=App.category.sortStandards(subcats);}
App.category.$.html(App.templates.category({category:params.name,subcats:subcats}));}},'stats':{as:'stats',uses:function(params){App.setState('statistics');}},'wishlist':{as:'wishlist',uses:function(params){App.setState('wishlist');}},'remote/:owner/:repo':{as:'remote',uses:function(params){App.setState('remote');App.remote.$.html(App.templates.remote({remote:(params.owner+'/'+params.repo)}));}},'':searchHandler});App.router.goto=function(route,params){return this.navigate(this.generate(route,params));}
App.category={};App.category.$=$('#categoryView');App.category.link=function(part,noLink){if(noLink){return part.name;}
return'<a href="'+App.router.generate('category',{name:part.id})+'">'+part.name+'</a>';};App.category.readable=function(category,onlyLeaf,noLink){var replacements={'cpp':'C++','lowlevel':'Low Level','highlevel':'High Level','fileformat':'File Format','png':'PNG','jpeg':'JPEG','gif':'GIF','tiff':'TIFF','xml':'XML','json':'JSON','yaml':'YAML','msgpack':'MessagePack','3dmodel':'3D Model','websockets':'WebSockets','http':'HTTP','3d':'3D','opengl':'OpenGL','mqtt':'MQTT','pubsub':'Pub/Sub','sip':'SIP','dns':'DNS','zeromq':'ZeroMQ','io':'IO','i18n':'i18n','orm':'ORM','mysql':'MySQL','odbc':'ODBC','sqlite':'SQLite','zip':'ZIP','regexp':'Regular Expressions','rpc':'RPC','cli_parsing':'CLI Parsing','dsl':'DSL','ai':'AI','statemachine':'State Machines','datetime':'Date/Time','bindings_interoperability':'Bindings/Interoperability','signals_slots':'Signals & Slots','mq':'Message Queue','drm':'DRM','system_framework':'System/Framework','csv':'CSV','vr_ar':'VR/AR','postgresql':'PostgreSQL'};var parts=category.split('.');parts=_.map(parts,function(part,index){var id=category.split('.').splice(0,index+1).join('.');if(part in replacements){return{id:id,name:replacements[part]};}else{return{id:id,name:part.split('_').map(function(s){return s.toTitleCase();}).join(' ')};}});if(category.startsWith('standard.')){if(onlyLeaf){if(parts.length===2){return this.link(parts[1],noLink);}else{return parts[1].name+this.link(parts[2],noLink);}}else{if(parts.length===2){return'Standard: '+this.link(parts[1]);}else{return'Standard: '+this.link(parts[1])+this.link(parts[2]);}}}else if(category.startsWith('status.')){parts[1].name=parts[1].name.substr(1).toTitleCase();if(onlyLeaf){return this.link(parts[1],noLink);}
return'Status: '+this.link(parts[1]);}else if(category.startsWith('environment.')){if(onlyLeaf){return this.link(parts[1],noLink);}
return'Environment: '+this.link(parts[1]);}else if(category.startsWith('topic.')){if(parts.length>2){var ret=parts[1].name+': ';parts=_.map(parts.splice(2),function(p){return this.link(p,noLink);},this);if(onlyLeaf){return parts[parts.length-1];}
return ret+parts.join(' &gt; ');}else{return parts[1].name;}}
return category.toTitleCase();};App.category.filter=function(categories){return _.filter(categories,function(cat){var subs=_.filter(categories,function(subcat){return subcat.startsWith(cat+'.');});return subs.length===0;});};App.category.all=_.chain(packages_data).map(_.property('categories')).flatten().value();App.category.allUnique=_.chain(App.category.all).uniq().sort().value();App.category.counts=_.countBy(App.category.all,_.identity);App.category.pkgCounts=_.chain(packages_data).map(_.property('categories')).map(App.category.filter).flatten().countBy(_.identity).value();App.category.forCategory=function(subcat,includeSubs){var pkgs=_.filter(packages_data,function(pkg){return pkg.categories.includes(subcat);});if(!includeSubs){pkgs=_.filter(pkgs,function(pkg){return!_.find(pkg.categories,function(cat){return cat.startsWith(subcat+'.');});});}
return pkgs;};App.category.sortStandards=function(categories){return _.sortBy(categories,function(cat){var parts=cat.split('.');var result=0;if(parts[1]==='c'){result=10000;}else if(parts[1]==='cpp'){result=20000;}
if(parts.length>=3){var shortYear=parseInt(cat.split('.')[2]);result+=shortYear;result+=shortYear>70?1900:2000;}
return result;});};App.category.readableStandards=function(categories){var standards=this.filter(categories);standards=_.filter(standards,function(cat){return cat.startsWith('standard.');});standards=this.sortStandards(standards);standards=_.map(standards,function(cat){return cat.replace('standard.','').replace('cpp','c++').replace('.','').toTitleCase();}).join('/');return standards;};$('[data-menu-prefix]').each(function(index,menu){var $menu=$(menu);var prefix=$menu.attr('data-menu-prefix');var categories=_.filter(App.category.allUnique,function(cat){return cat.startsWith(prefix)&&cat.split('.').length===prefix.split('.').length;});categories.sort();_.each(categories,function(cat){$menu.append(App.templates.menuItem({name:App.category.readable(cat,true,true),href:App.router.generate('category',{name:cat}),count:App.category.counts[cat]}));});});$('#numPackages').html(packages_data.length);var repos=_.uniq(_.flatten(_.map(packages_data,function(pkg){return _.map(pkg.recipies,function(r){return r.repo.bintray.split('/').splice(0,2).join('/');})})));$('#numRemotes').html(repos.length);var $results=$('#results');_.each(packages_data,function(pkg){$results.append(App.templates.pkgResult(_.extend({noTags:false},pkg)));});App.search={};App.search.$=$('#searchView');App.search.$results=App.search.$.find('#results');App.search.searchIndex=new Fuse(packages_data,{id:'id',shouldSort:true,threshold:0.3,location:0,distance:100,maxPatternLength:32,minMatchCharLength:2,includeMatches:true,keys:[{"name":"name","weight":0.5},{"name":"description","weight":0.2},{"name":"keywords","weight":0.3}]});App.search.showPackagesInResult=function(ids){$('.package_result').removeClass('hidden');if(ids.length===0){$('.package_result:not(.disabled)').addClass('hidden');}else{$('.package_result.disabled').addClass('hidden');var $results=App.search.$results;if(ids.length!==packages_data.length){$results.find('> a:not('+_.map(ids,function(id){return'#package_'+id;}).join(',')+')').addClass('hidden');var allResults=$results.children('a:not(.hidden)');var mappedResults={};allResults.detach().each(function(i,e){mappedResults[e.id.replace('package_','')]=e;});$results.append(_.map(ids,function(id){return mappedResults[id];}));}
$results.find('a:not(.disabled)').removeClass('rounded-top').removeClass('rounded-bottom');$results.find('#package_'+ids[0]).addClass('rounded-top');$results.find('#package_'+ids[ids.length-1]).addClass('rounded-bottom');}};App.search.highlightSearchTerms=function(terms){var prepend='<span class="highlighted_search_term">';var append='</span>';$('span.highlighted_search_term').parent().each(function(index,elem){var $elem=$(elem);$elem.html($elem.html().replace(new RegExp(prepend,'g'),'').replace(new RegExp(append,'g'),''));});_.each(terms,function(result){var $item=$('#package_'+result.item);_.each(result.matches,function(match){var $attribute=$item.find('.attribute_'+match.key);if($attribute.length>0){var content=$attribute.html();var indices=match.indices;indices.sort(function(a,b){return a[0]<b[0];});_.each(indices,function(index){content=content.substr(0,index[0])+
prepend+content.substr(index[0],index[1]+1-index[0])+append+
content.substr(index[1]+1);});$attribute.html(content);}});});};App.search.showResultsForFilter=function(filter){if(filter===''){this.highlightSearchTerms([]);this.showPackagesInResult(_.map(packages_data,_.property('id')));}else{var results=this.searchIndex.search(filter);this.showPackagesInResult(_.map(results,_.property('item')));this.highlightSearchTerms(results);}};App.search.$input=$('#searchInput');App.search.$input.on('keyup change focusout paste propertychange',function(){App.router.navigate(App.router.generate('search',{query:App.search.$input.val()}));});App.package={};App.package.$=$('#packageView');App.package.showFile=function(file){return;$('[data-filekey]:not(.nav-link)').hide();$('[data-filekey='+file+']:not(.nav-link)').show();$('.nav-link[data-filekey]').removeClass('active');$('.nav-link[data-filekey='+file+']').addClass('active');};App.package.updateCurrentVersion=function(select){var $select=$(select);var pkg=_.find(packages_data,function(p){return p.name===$select.attr('data-package');});var version=pkg.versions[$select.val()];var $container=$select.parent();$container.find('[data-field]').each(function(index,element){var $element=$(element);$element.html(version[$element.attr('data-field')]);});};App.remote={};App.remote.$=$('#remoteView');App.remote.forRemote=function(remote){return _.chain(packages_data).filter(function(pkg){return _.find(pkg.recipies,function(rec){return rec.repo.bintray.startsWith(remote+'/');})}).sortBy(function(pkg){return pkg.name;}).value();};App.remote.all=_.chain(packages_data).map(function(pkg){return _.map(pkg.recipies,function(r){return r.repo.bintray.split('/').splice(0,2).join('/');});}).flatten().value();App.remote.allUnique=_.uniq(App.remote.all).sort();App.remote.counts=_.countBy(App.remote.all,_.identity);App.remote.sortedCounts=_.chain(App.remote.counts).map(function(count,key){return[key,count];}).sortBy(function(r){return r[1];}).value();var $menuRemote=$('[data-menu-remote]');_.each(App.remote.allUnique,function(remote){var parts=remote.split('/');$menuRemote.append(App.templates.menuItem({name:remote,href:App.router.generate('remote',{owner:parts[0],repo:parts[1]}),count:App.remote.counts[remote]}));});var hues=['red','orange','yellow','green','blue','purple','pink'];hues=hues.concat(hues);hues=hues.concat(hues);hues=hues.concat(hues);function getSunburstCategoryData(prefix){var prefixPartCount=prefix.split('.').length;var children=_.filter(App.category.allUnique,function(cat){return cat.startsWith(prefix)&&cat.split('.').length===prefixPartCount;});var category=prefix.substr(0,prefix.length-1);var name=App.category.readable(category,true,true);if(children.length===0){return{name:name,id:category,value:App.category.pkgCounts[category]};}else{var general={name:'',id:category,value:App.category.pkgCounts[category]};return{name:name,id:category,hue:hues.pop(),children:_.map(children,function(cat){return getSunburstCategoryData(cat+'.');}).concat([general])};}}
function setupSunburst(selector,button,data){var $element=$(selector);var element=$element[0];var chart=new Sunburst();chart.data(data).width(element.offsetWidth).height(element.offsetHeight)(element);chart.color(function(node,parent){var baseLevel=-1;if(node.id.startsWith('topic.tool')){baseLevel=2;}else if(node.id.startsWith('topic.library')){baseLevel=3;}else if(node.id.startsWith('standard.')){baseLevel=1;}
if(node.id.split('.').length<baseLevel||!parent){return randomColor({hue:'monochrome',luminosity:'bright'});}
var subTopic={data:node,parent:parent};while(subTopic.data.id.split('.').length>baseLevel){subTopic=subTopic.parent;}
return randomColor({hue:subTopic.data.hue,luminosity:'bright',format:'rgba',alpha:1/(Math.max(1,parent.depth-2)*1.5)});});$(window).resize(function(evt){chart.width(element.offsetWidth).height(element.offsetHeight);});var $button=$(button);function updateFunc(){if(chart.focusOnNode()){$button.show();var category=chart.focusOnNode().data.id;$button.find('span').html(App.category.readable(category,false,false));}else{$button.hide();}
setTimeout(updateFunc,250);}
updateFunc();}
App.statistics={};App.statistics.$=$('#statisticsView');App.statistics.$findings=App.statistics.$.find('#findings');App.initialized=false;App.statistics.onEnter=function(){if(this.initialized){return;}
this.initialized=true;setupSunburst(document.getElementById('chartA'),document.getElementById('chartAButton'),getSunburstCategoryData('topic.'));setupSunburst(document.getElementById('chartB'),document.getElementById('chartBButton'),getSunburstCategoryData('standard.'));var onClickVisit={library:{onClick:function(event,elements){var remote=elements[0]._model.label.split('/');App.router.goto('remote',{owner:remote[0],repo:remote[1]});}}};var counts={};_.each(packages_data,function(pkg){_.each(pkg.versions,function(version){var repo=version.repo.split('/').splice(0,2).join('/');if(!counts[repo]){counts[repo]=1;}else{counts[repo]++;}});});counts=_.chain(counts).map(function(count,repo){return[repo,count];}).sortBy(function(arr){return arr[1];}).value();new Chartkick.BarChart('chartC',App.remote.sortedCounts.reverse(),onClickVisit);new Chartkick.BarChart('chartD',counts.reverse(),onClickVisit);this.$findings.html('');var notInCenter=_.chain(packages_data).filter(function(pkg){return pkg.officiallity!=='conan-center';}).filter(function(pkg){return pkg.recipies.length>3;}).sortBy(function(pkg){return pkg.recipies.length;}).value().reverse();if(notInCenter.length>0){this.$findings.append(App.templates.findingManyRemotes({packages:notInCenter}));}};App.statistics.onEntered=function(){$(window).trigger('resize');};App.wishlist={};App.wishlist.$=$('#wishlistView');App.wishlist.$wishlistPackages=$('#wishlistPackages')
App.initialized=false;App.wishlist.onEnter=function(){if(this.initialized){return;}
this.initialized=true;let generatedhtml="";let sortedWishlist=[];$("#numPackagesWishes").text(Object.keys(wishlist_data).length);Object.keys(wishlist_data).forEach((key)=>{sortedWishlist.push([wishlist_data[key]["upvotes"],wishlist_data[key]["issue"],wishlist_data[key]["issuetitle"]]);});sortedWishlist.sort((a,b)=>{return b[0]-a[0];});for(let wish of sortedWishlist){let upvotesOutput=wish[0].toString();generatedhtml+="<li><span class='wishlist-upvotes'>👍 "+upvotesOutput+"</span> <a href='https://github.com/conan-io/wishlist/issues/"+wish[1]+"' target='_blank'>"+wish[2]+"</a></li>";}
this.$wishlistPackages.html(generatedhtml);};App.wishlist.onEntered=function(){$(window).trigger('resize');};$(function(){App.router.resolve();});