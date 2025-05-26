let character_names_blacklist = ["Dalek","Daleks","Cyberman","Cybermen","Cyber-Leader","Major","Silurian","Sontaran","Sea Devil","Judoon","Slitheen","Zygon","Ice Warrior","Auton","Weeping Angel","Ood","Silas Carson","Roy_Skelton"]

let optional_doctor_blacklist = ["First_Doctor","Second_Doctor","Third_Doctor","Fourth_Doctor","Fifth_Doctor","Sixth_Doctor","Seventh_Doctor","Eighth_Doctor","War_Doctor","Ninth_Doctor","Tenth_Doctor","Eleventh_Doctor","Twelfth_Doctor","Thirteenth_Doctor","Fugitive_Doctor","Fourteenth_Doctor","Fifteenth_Doctor"]

let temporary_blacklist = [];

let companion_names = [
"Susan_Foreman","Barbara_Wright","Ian_Chesterton","Vicki_Pallister",
"Steven_Taylor","Katarina","Sara_Kingdom","Dodo_Chaplet","Polly_Wright",
"Ben_Jackson","Jamie_McCrimmon","Victoria_Waterfield","Zoe_Heriot",
"Alistair_Gordon_Lethbridge-Stewart","Liz_Shaw","Jo_Grant",
"Sarah_Jane_Smith","Harry_Sullivan","Leela","K9","Romana_I","Romana_II",
"Adric","Nyssa","Tegan_Jovanka","Vislor_Turlough","Kamelion","Peri_Brown",
"Melanie_Bush","Ace","Rose_Tyler","Adam_Mitchell","Jack_Harkness",
"Mickey_Smith","Donna_Noble","Martha_Jones","Wilfred_Mott","Amy_Pond",
"Rory_Williams","River_Song","Clara_Oswald","Nardole","Bill_Potts",
"Graham_O'Brien","Yasmin_Khan","Ryan_Sinclair","Dan_Lewis","Ruby_Sunday","Belinda_Chandra"
]

function decodeName(input){
  return decodeURIComponent(input).replaceAll("_"," ").trim();  
}

function displayName(input, italic, title){
    let tagName = italic ? "em" : "strong";
    return "<"+tagName+" class='nowrap'"+(title == null ? "" : "title='"+title+"'")+">"+decodeName(input)+"</"+tagName+">"
}

function trim_story_url(input){
  let wikiSplit = input.split("/wiki/");
  return wikiSplit[wikiSplit.length-1].split("(")[0].trim()
}

function isVowel(letter){
  letter = letter.toLowerCase();
  switch (letter){
    case "a": case "e": case "i": case "o": case "u":
      return true;
    default:
      return false;
  }
}

function getNumAppearancesAsString(chara){
  return chara.episodes.length + (chara.episodes.length == 1 ? " appearance" : " appearances")
}

function get_verbose_report(connection){
  let characters = charmap.characters;  
  let episodes = charmap.episodes;

  let path = connection["path"]

  if (path == "blacklist"){
    return "<strong>Unable to connect those characters.</strong><br/><br/><strong>Reason:</strong> The second character was in the blacklist. Some monsters, like Dalek, Cyberman, etc., have been put on a connections blacklist because they're more of a species than a character.";
  }

  if (connection.start == -1 || connection.end == -1){
    return "<strong>Unable to connect those characters.</strong><br/><br/><strong>Reason:</strong> At least one of the characters could not be identified.<br><br>Have you checked the autocomplete results to make sure you've formatted their name as expected?";
  }

  let startChara = characters[connection["start"]];  
  let endChara = characters[connection["end"]];  

  if (path == null){
    return displayName(startChara["name"], false, getNumAppearancesAsString(startChara)) + " could not be connected to " + displayName(endChara["name"], getNumAppearancesAsString(endChara), false) +".";
  }

  let output = document.getElementById("blacklist-the-doctor").checked ? "Without using the Doctor, " : "";
  
  output += displayName(startChara["name"],false,getNumAppearancesAsString(startChara)) + " has "+ (isVowel(endChara["name"][0]) ? "an " :"a ") + displayName(endChara["name"],false,getNumAppearancesAsString(endChara)) +" score of " + String(connection["score"]) +".<br/><br/>"
  
  output += displayName(startChara["name"], false, getNumAppearancesAsString(startChara)) +" was in "

  
for (let i = 0; i < path.length; i++){
    let point = path[i];
    let ep = episodes[point["ep"]];
    let chara = characters[point["chr"]];
    output += displayName(trim_story_url(ep["episode"]),true, "aired "+ep["y"]) + " with " + displayName(chara["name"], false, getNumAppearancesAsString(chara))
    if (i < path.length - 1){
      output += ", who was in "
    } 
  }
  return output + "."
}

function establishAutocomplete(input, arr) {
    var currentFocus;
    input.addEventListener("input", function(e) {
        var a, b, i, val = this.value;
        closeAllLists();
        if (!val) { return false;}
        currentFocus = -1;
        a = document.createElement("div");
        a.setAttribute("id", this.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        let listItems = []
        this.parentNode.appendChild(a);
        for (i = 0; i < arr.length; i++) {
          let decodedName = decodeName(arr[i].name);
          if (decodedName.substring(0, val.length).toUpperCase() == val.toUpperCase()) {
            b = document.createElement("div");
            b.innerHTML = "<strong>" + decodedName.substring(0, val.length) + "</strong>";
            b.innerHTML += decodedName.substring(val.length);
            b.innerHTML += "<input type='hidden' value=\"" + decodedName + "\"'>";
                b.addEventListener("click", function(e) {
                  input.value = this.getElementsByTagName("input")[0].value;
                closeAllLists();
            });
            listItems.push(b);
          }
        }
        listItems.sort((a,b)=>{return a.innerHTML == b.innerHTML ? 0 : (a.innerHTML < b.innerHTML ? -1 : 1)})
        listItems.forEach(item => {
          a.appendChild(item);
        });
    });
    input.addEventListener("keydown", function(e) {
        var x = document.getElementById(this.id + "autocomplete-list");
        if (x) {
          x = x.getElementsByTagName("div");
        }
        if (e.keyCode == 40) {
          currentFocus++;
          addActive(x);
        } else if (e.keyCode == 38) { //up
          currentFocus--;
          addActive(x);
        } else if (e.keyCode == 13) {
          e.preventDefault();
          if (currentFocus > -1) {
            if (x) x[currentFocus].click();
          }
        }
    });
    function addActive(x) {
      if (!x){
        return false;
      }
      removeActive(x);
      if (currentFocus >= x.length) currentFocus = 0;
      if (currentFocus < 0) currentFocus = (x.length - 1);
      x[currentFocus].classList.add("autocomplete-active");
    }
    function removeActive(x) {
      for (var i = 0; i < x.length; i++) {
        x[i].classList.remove("autocomplete-active");
      }
    }
    function closeAllLists(element) {
      var x = document.getElementsByClassName("autocomplete-items");
      for (var i = 0; i < x.length; i++) {
        if (element != x[i] && element != input) {
        x[i].parentNode.removeChild(x[i]);
      }
    }
  }
  document.addEventListener("click", function (e) {
      closeAllLists(e.target);
  });
  }

let charmap = null;
let goButton = document.getElementById("go");
goButton.onclick = ()=>{
   let benchmark = new Date().getTime();
   let connection = attemptToFindConnection_BFS(charaA.value.trim(), charaB.value.trim(), false);
   console.log("Time taken: "+((new Date().getTime() - benchmark)/1000.0) + " seconds")
   document.getElementById("report").innerHTML = get_verbose_report(connection);
};

let charaA = document.getElementById("character-A");
let charaB = document.getElementById("character-B");

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

document.getElementById("randomise-A").onclick = () => {  
  charaA.value = decodeName(charmap.characters[getRandomInt(charmap.characters.length)].name);
};

document.getElementById("randomise-B").onclick = () => {  
  charaB.value = decodeName(charmap.characters[getRandomInt(charmap.characters.length)].name);
};

document.getElementById("longest-connection-info").onclick = ()=>{
  alert("When you exclude the Doctor, I think the longest connection between any two characters is 8, from:\n\n• Any character exclusive to Class who was NOT in 'For Tonight we Might Die' (e.g. Dorothea Ames)\n\nTO\n\n• Any character who only appeared in 'The Deadly Assassin' (e.g. Spandrell)\n\nAnother good shout is Mission to the Unknown, but it tends to have a slightly lower score due to some easy New Who connections to the 60s, like Ian Chesterton.\n\nWhen including the Doctor, Mission to the Unknown is probably your best bet. As of writing this, you can even get 5th degree, Doctor-inclusive connections between Mission to the Unknown and Joy to the World, though I imagine that could change as the Fifteenth Doctor becomes better-connected.\n\nIf excluding the Doctor, you can technically get an answer of infinity using Albert Einstein, because the only way out of 'Death is the Only Answer' is through the Eleventh Doctor.")
}

function getAllRecurringCharacterIDs(){
  return charmap.characters.filter((chr) => chr.episodes.length > 1).map((x)=>get_char_ID_by_name(x.name))
}

function getAllDoctorIDs(){
  return optional_doctor_blacklist.map((x)=>{return get_char_ID_by_name(x)});
}

function getAllCompanionIDs(){
  return companion_names.map((x)=>{return get_char_ID_by_name(x)});
}

function getCharacterIDWithTheMostUniqueConnections(charIDs){
  let best = {episodes:[]}
  let best_num = 0;
  for (let i = 0; i < charIDs.length; i++){
    let chara = charmap.characters[charIDs[i]];
    let seen_chars = [];
    chara.episodes.forEach(episodeId => {
      charmap.episodes[episodeId].chars.forEach(otherChar => {
        if (!seen_chars.includes(otherChar)){
          seen_chars.push(otherChar);
        }
      });
    });
    if (seen_chars.length > best_num){
      best = chara;
      best_num = seen_chars.length;
    }
  }
  return get_char_ID_by_name(best.name)
}

let drag = (simulation) => {
  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }
  
  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }
  
  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }
  
  return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
}

function convertDecodedNamesToIDs(a,b){
  let charas = charmap.characters;

  let aFound = false;
  let bFound = false;
  
  a = a == null ? null : a.toLowerCase();
  
  if (b != -2){
    b = b.toLowerCase();
  }

  for (let i = 0; i < charas.length; i++){ //reassociate the clean, autocompleted versions of the character names with their characters again
    let decodedName = decodeName(charas[i].name).toLowerCase();
    if (decodedName == a){
      a = i;
      aFound = true;
    }
    if (decodedName == b){
      b = i;
      bFound = true;
    }
    if (aFound && bFound){
      break;
    }
  }

  if (!aFound){
    a = -1;
  }

  if (!bFound){
    b = b == -2 ? -2 : -1;  //-2 is for finding a minimum spanning tree
  }

  return [a,b];
}

function get_char_ID_by_name(name){
  name = decodeName(name)
  let characters = charmap.characters;  
  for (let i = 0; i < characters.length; i++){
      let character = characters[i];
      if (decodeName(character.name) == name){
          return i;
        }      
  }
  return null
}

function createDeFactoBlacklist(){

  let BL = character_names_blacklist.map((x) => {return get_char_ID_by_name(x)});

  if (document.getElementById("blacklist-the-doctor").checked){
    BL = BL.concat(optional_doctor_blacklist.map((x) => {return get_char_ID_by_name(x)}));
  }

  BL = BL.concat(temporary_blacklist)

  return BL;
}

let MST_chars_and_parent_eps = {}
let MST_seen_eps = [];
let MST_eps_and_parent_chars = {}

function attemptToFindConnection_BFS(start,end){
    let complete = false;

    MST_chars_and_parent_eps = {};
    MST_seen_eps = [];
    MST_eps_and_parent_chars = {}

    let decoded = convertDecodedNamesToIDs(start,end);

    start = decoded[0]
    end = decoded[1]

    let characters = charmap.characters;  
    let episodes = charmap.episodes;

    if (start == -1 || end == -1){
      console.log("Invalid start or end character");
      return {"start":start,"end":end,"score":-1,"path":null};
    }

    blacklist = createDeFactoBlacklist();

    if (start == end){        
        console.log("Start and end are the same person")
        return {"start":start,"end":end,"score":0,"path":[{"ep":characters[start]["episodes"][0], "chr":start}]}
    }

    if (blacklist.includes(start)){
        console.log("Intended start point '"+characters[start]["name"]+"' was in blacklist; will skip.")
        return {"start":start,"end":end,"score":-1,"path":null}
    }
        
    if (blacklist.includes(end)){
      console.log("Intended endpoint '"+characters[end]["name"]+"' was in blacklist; will skip.")
      return {"start":start,"end":end,"score":-1,"path":null}
    }
    
    let queue = [start]
    let prevs = {}
    let visited = [start]

    //console.log(queue)

    prevs[String(start)] = -1

    while (!complete){

        if (queue.length == 0){
            console.log("Exhausted all node adjacencies!");
            break;
        }

        let node = queue.shift()

        //console.log("Expanding "+characters[node]["name"])

        for (let i = 0; i < characters[node]["episodes"].length; i++){
            let episode = characters[node]["episodes"][i]
            if (end == -2 && !MST_seen_eps.includes(episode)){
              MST_eps_and_parent_chars[String(episode)] = node;
              MST_seen_eps.push(episode);
            }
            //print("Looking at episode "+episodes[episode]["episode"])
            for (let j = 0; j < episodes[episode]["chars"].length; j++){
                let c = episodes[episode]["chars"][j]
                if (!visited.includes(c) && !blacklist.includes(c)){
                  if (end == -2 && !blacklist.includes(c)){
                    MST_chars_and_parent_eps[String(c)] = episode;
                  }
                  prevs[String(c)] = node
                  queue.push(c)
                  visited.push(c)                  
                  if (c == end){
                    complete = true;
                    break;
                  }
                } 
              }
            if (complete){
              break;
            }                
        }
    }

    //console.log("Finished BFS loop")

    if (!complete){
      if (end == -2){
        console.log("Minimum spanning tree data created in MST_chars_and_parent_eps")
        console.log(MST_chars_and_parent_eps)
        return {"start":start,"end":end,"score":-1,"path":null}
      } else {
        let failure_text = "Could not link "+decodeName(characters[start]["name"]) + " to "+decodeName(characters[end]["name"])
        console.log(failure_text)        
        return {"start":start,"end":end,"score":-1,"path":null}
      }
    }

    let output = ""
    let char_id = end
    let first_time = true

    let score = 0
    let p = []

    while (prevs[String(char_id)] != -1){
        let prev = prevs[String(char_id)]
        let ep_id = get_episode_ID_in_common(prev, char_id)
        
        p.push({"ep":ep_id, "chr":char_id})

        score += 1
        output = " was in " + trim_story_url(decodeName(episodes[ep_id]["episode"])) + " with " + decodeName(characters[char_id]["name"]) + (first_time ? "" : ", who") + output
        first_time = false
        char_id = prev
    }

    output = decodeName(characters[start]["name"]) + output

    return {
        "start":start,
        "end":end,
        "score":score,
        "path":p.reverse()
    }
}

function get_episode_ID_in_common(c1, c2){
  for (let i = 0; i < charmap.characters[c1]["episodes"].length; i++){
    let episode = charmap.characters[c1]["episodes"][i];
    for (let j = 0; j < charmap.characters[c2]["episodes"].length; j++){
      let other_episode = charmap.characters[c2]["episodes"][j];
      if (episode == other_episode){
        return episode;
      }
    }
  }
  return null
}

function getColourForEpWithId(id){
  
    let episode = charmap.episodes[id];

    let year = episode["y"];

    if (year == null){
      return "white";
    }

    switch(year.substring(0,3)){
        case "196":
          return "PowderBlue";
        case "197":
          return "GreenYellow";
        case "198":
          return "Khaki";
        case "200":
          return "LightSalmon"
        case "201":
          return "PaleVioletRed";
        case "202":
          return "Violet";
        default:
          return "white";
    }
}

function makeD3Chart(id_of_starting_person, whitelist, use_whitelist){

  let data = {
  name: decodeName(charmap.characters[id_of_starting_person]["name"]),
  id:id_of_starting_person,
  isEp: false,
  children: []
  }

  let seen_chars = [id_of_starting_person];
  let seen_eps = []
  let char_objs_by_id = {};
  char_objs_by_id[String(id_of_starting_person)] = data;
  let episode_objs_by_id = {};

  //get data

  temporary_blacklist = [];

  if (use_whitelist){
    for (let i = 0; i < charmap.characters.length; i++){
      if (i == id_of_starting_person){
        continue;
      }
      if (!whitelist.includes(i)){
        temporary_blacklist.push(i);
      }
    }
  }
  attemptToFindConnection_BFS(data.name, -2); //running in MST mode
  Object.keys(MST_chars_and_parent_eps).forEach(charId => {

    let char_obj = null;
    if (seen_chars.includes(parseInt(charId))){
      char_obj = char_objs_by_id[charId];
    } else {
      seen_chars.push(parseInt(charId));
      char_obj = {name: decodeName(charmap.characters[parseInt(charId)].name), id:parseInt(charId), isEp:false, children:[]}
      char_objs_by_id[charId] = char_obj;
    }

    let ep_obj = null;
    let epId = parseInt(MST_chars_and_parent_eps[charId])
    if (seen_eps.includes(epId)){
      ep_obj = episode_objs_by_id[String(epId)];
    } else {
      seen_eps.push(epId)
      ep_obj = {name: decodeName(charmap.episodes[epId].episode), id:epId, isEp:true, children:[]}
      episode_objs_by_id[String(epId)] = ep_obj;
    }

    if (!ep_obj.children.includes(char_obj)){
      ep_obj.children.push(char_obj)
    }

    let parent_charId_of_episode = null;

    if (parseInt(charId) == id_of_starting_person){
      parent_charId_of_episode = id_of_starting_person;
    } else {
      parent_charId_of_episode = MST_eps_and_parent_chars[epId];
    }

    if (seen_chars.includes(parent_charId_of_episode)){ //as an addendum, if seen_chars includes the episode's parent character, set that characters as the episode's parent if it exists and create it if it doesn't
      if (!char_objs_by_id[String(parent_charId_of_episode)].children.includes(ep_obj)){
        char_objs_by_id[String(parent_charId_of_episode)].children.push(ep_obj)
      }  
    } else {
        seen_chars.push(parent_charId_of_episode)
        char_objs_by_id[String(parent_charId_of_episode)] = {name: decodeName(charmap.characters[parseInt(parent_charId_of_episode)].name), id:parent_charId_of_episode, isEp:false, children:[ep_obj]}
    }
    
  });

  temporary_blacklist = [];
  console.log(data)

    // Compute the graph and start the force simulation.
    const root = d3.hierarchy(data);
    const links = root.links();
    const nodes = root.descendants();
  
    // Specify the chart’s dimensions.
    const width = window.innerWidth * (root.height / 1.5);
    const height = window.innerWidth * (root.height / 1.5);

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(0).strength(1))
        .force("charge", d3.forceManyBody().strength(-3600))
        .force("x", d3.forceX())
        .force("y", d3.forceY());
  
    // Create the container SVG.
    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-width / 2, -height / 2, width, height])
        .attr("style", "font-size:1.2em;font-weight:bold;");
  
    // Append links.
    const link = svg.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line");
  
    // Append nodes.
    const node = svg
    .append("g")
    .selectAll("g")
    .data(nodes)
    .join("g")
    .call(drag(simulation));

  node.append("circle")
    .attr("r", 6)
    .attr("fill", (d)=>{return d.data.isEp ? "white" : "black"})
    .attr("stroke", (d)=>{return d.data.isEp ? "black" : "white"});
  
  node.append("text")
    .text(d => {let removeParenttheses = d.data.name.split("(")[0]; return removeParenttheses.includes(" ") ? removeParenttheses.split(" ")[0] : "";})
    .attr("transform", (d) => `translate(${0} ${-32})`)
    .attr("style", (d)=>"white-space:break-spaces; user-select:none;text-transform:"+(d.data.isEp ? "uppercase" : "inherit"))
    .attr("fill", "black")
    .attr("stroke", "white")
    .attr("text-anchor","middle");

  node.append("text")
    .text(d => {let removeParenttheses = d.data.name.split("(")[0]; return removeParenttheses.substring(d.data.name.indexOf(' ')+1)})
    .attr("transform", (d) => `translate(${0} ${-16})`)
    .attr("style", (d)=>"white-space:break-spaces; user-select:none;text-transform:"+(d.data.isEp ? "uppercase" : "inherit"))
    .attr("fill", "black")
    .attr("stroke", "white")
    .attr("text-anchor","middle");
  
    const endTime = Date.now() + 2500;

    function moveToBack(item, parent){
      var firstChild = parent.firstChild; 
          if (firstChild) { 
            parent.insertBefore(item, firstChild); 
          } 
    }

    let dataColours = [];

    root.each((n)=>{
      if (n.data.isEp){
        dataColours.push(getColourForEpWithId(n.data.id));
      } else if (n.parent != null) {
        dataColours.push(getColourForEpWithId(n.parent.data.id));
      } else {
        dataColours.push("white")
      }
    });

    simulation.on("tick", () => {
      if (Date.now() >= endTime){
        simulation.stop()
        let flattenedData = []
        root.each((n)=>{
          flattenedData.push([n.x,n.y]);
        });

        let delaunay = d3.Delaunay.from(flattenedData)
        let voronoi = delaunay.voronoi([-width, -height, width, height])
        
        for (let i = 0; i < flattenedData.length; i++) {
          let item = svg.append("path")
          .attr("fill", dataColours[i])
          .attr("stroke", "#ccc")
          .attr("d", voronoi.renderCell(i));
          moveToBack(item, svg);
        }
        
        let pts = svg.append("path")
        .attr("d", delaunay.renderPoints(null, 2));
        moveToBack(pts, svg);

        svg.selectAll("g").raise()
      }
      link
          .attr("x1", d => d.source.x)
          .attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x)
          .attr("y2", d => d.target.y);
      node.attr("transform", (d) => `translate(${d.x} ${d.y})`);
    });
    return svg.node();
}

async function start(){
  const response = await fetch("charmap.json");
  charmap = await response.json();
  establishAutocomplete(charaA, charmap.characters);
  establishAutocomplete(charaB, charmap.characters);

  return

  document.getElementById("blacklist-the-doctor").checked = true;
  let svgParent = document.getElementById("svg-parent");
  svgParent.style= "";
  svgParent.appendChild(
    makeD3Chart(
      get_char_ID_by_name("Belinda_Chandra"),
      getAllCompanionIDs(),
      false
      )
  );
  svgParent.scrollTo(svgParent.scrollWidth / 2, svgParent.scrollHeight / 2);
}

start();