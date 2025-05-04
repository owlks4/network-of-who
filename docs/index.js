let character_names_blacklist = ["Dalek","Daleks","Cyberman","Cybermen","Cyber-Leader","Major","Silurian","Sontaran","Sea Devil","Judoon","Slitheen","Zygon","Ice Warrior","Auton","Weeping Angel","Ood","Silas Carson","Roy_Skelton","Major"]

let optional_doctor_blacklist = ["The_Doctor","First_Doctor","Second_Doctor","Third_Doctor","Fourth_Doctor","Fifth_Doctor","Sixth_Doctor","Seventh_Doctor","Eighth_Doctor","War_Doctor","Ninth_Doctor","Tenth_Doctor","Eleventh_Doctor","Twelfth_Doctor","Thirteenth_Doctor","Fugitive_Doctor","Fourteenth_Doctor","Fifteenth_Doctor"]

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
"Graham_O'Brien","Yasmin_Khan","Ryan_Sinclair","Dan_Lewis","Ruby_Sunday"
]

function decodeName(input){
  return decodeURIComponent(input).replaceAll("_"," ").trim();  
}

function displayName(input, italic){
    let tagName = italic ? "em" : "strong";
    return "<"+tagName+" class='nowrap'>"+decodeName(input)+"</"+tagName+">"
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

if (window.innerWidth < 1000){
  document.getElementById("title").innerHTML = "Six Degrees of<br>Doctor Who"
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

  if (path == null){
    return displayName(characters[connection["start"]]["name"], false) + " could not be connected to " + displayName(characters[connection["end"]]["name"], false) +".";
  }
  
  let endName = characters[connection["end"]]["name"];

  let output = document.getElementById("blacklist-the-doctor").checked ? "Without using the Doctor, " : "";
  
  output += displayName(characters[connection["start"]]["name"],false) + " has "+ (isVowel(endName[0]) ? "an " :"a ") + displayName(endName,false) +" score of " + String(connection["score"]) +".<br/><br/>"
  
  output += displayName(characters[connection["start"]]["name"]) +" was in "

  
for (let i = 0; i < path.length; i++){
    let point = path[i];
    output += displayName(trim_story_url(episodes[point["ep"]]["episode"]),true) + " with " + displayName(characters[point["chr"]]["name"], false)
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

document.getElementById("dotd-disclaimer").onclick = ()=>{
  alert("Why aren't the classic Doctors counted as being in The Day of the Doctor?\n\nAnswer: When included, the classic cameos in DOTD have an unjustifiably large impact on the connections web for what is really just a stock footage appearance, even if it's supposed to be unique from a story point of view.\n\nThere are plenty of other tentpole connections, like Ian in Power of the Doctor, and it'd be a shame if they never had the opportunity to be used!\n\nThe same decision was made with the Brig's voice cameo in Flux. I kept the Fourth Doctor in The Five Doctors because those clips WERE effectively a new 4/Romana scene on broadcast, even though they were filmed as part of Shada.")
}

document.getElementById("longest-connection-info").onclick = ()=>{
  alert("When you exclude the Doctor, I think the longest connection between any two characters is 8, from:\n\n• Any character exclusive to Class who was NOT in 'For Tonight we Might Die' (e.g. Dorothea Ames)\n\nTO\n\n• Any character who only appeared in 'The Deadly Assassin' (e.g. Spandrell)\n\nAnother good shout is Mission to the Unknown, but it tends to have a slightly lower score due to some easy New Who connections to the 60s, like Ian Chesterton.\n\nWhen including the Doctor, Mission to the Unknown is probably your best bet. As of writing this, you can even get 5th degree, Doctor-inclusive connections between Mission to the Unknown and Joy to the World, though I imagine that will change as the Fifteenth Doctor becomes better-connected.")
}

async function start(){
  const response = await fetch("charmap.json");
  charmap = await response.json();
  establishAutocomplete(charaA, charmap.characters);
  establishAutocomplete(charaB, charmap.characters);
  
  return;
  document.getElementById("blacklist-the-doctor").checked = true;
  let svgParent = document.getElementById("svg-parent");
  svgParent.appendChild(
    makeD3Chart(
      get_char_ID_by_name("Sarah_Jane_Smith"), companion_names.map((x)=>{return get_char_ID_by_name(x)})
      )
  );
  svgParent.scrollTo(svgParent.scrollWidth / 2, svgParent.scrollHeight / 2);
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

  a = a.toLowerCase();
  b = b.toLowerCase();

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
    b = -1;
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

function attemptToFindConnection_BFS(start,end){
    let complete = false;

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
            //print("Looking at episode "+episodes[episode]["episode"])
            for (let j = 0; j < episodes[episode]["chars"].length; j++){
                let c = episodes[episode]["chars"][j]
                if (!visited.includes(c) && !blacklist.includes(c)){
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
      let failure_text = "Could not link "+decodeName(characters[start]["name"]) + " to "+decodeName(characters[end]["name"])
      console.log(failure_text)        
      return {"start":start,"end":end,"score":-1,"path":null}
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

function makeD3Chart(id_of_starting_person, destination_ids){

  alert("Fair warning: this graphing system was designed on top of the BFS function instead of being integrated into it, so there are a LOT of wasted calls.")

  let data = {
  name: decodeName(charmap.characters[id_of_starting_person]["name"]),
  isEp: false,
  children: [],
  score: 0
  }

  let seen_chars = [id_of_starting_person];
  let seen_eps = []
  let char_objs_by_id = {};
  char_objs_by_id[String(id_of_starting_person)] = data;
  let episode_objs_by_id = {};

  //get data

  let MAX_LOOPS = 999999;

  temporary_blacklist = [];
  for (let i = 0; i < charmap.characters.length; i++){
    if (i == id_of_starting_person){
      continue;
    }
    if (!destination_ids.includes(i)){
      temporary_blacklist.push(i);
    }
  }

  let blacklist = createDeFactoBlacklist();

  destination_ids.sort((a,b)=>{ //sort destinations so that we visit the ones with the most episodes under their belt first, it's not perfect because the BFS algorithm never sees this so won't abide by it, but this should still improve the efficiency of the tree very slightly
    let epsA = charmap.characters[a].episodes.length;
    let epsB = charmap.characters[b].episodes.length;
    return epsA == epsB ? 0 : (epsA > epsB ? -1 : 1)
  });

  for (let index = 0; index < destination_ids.length; index++){

    console.log(index+"/"+destination_ids.length)
    
    let c = destination_ids[index];

    if (c == id_of_starting_person){
      continue;
    }
    if (seen_chars.includes(c)){
      continue;
    }
    if (blacklist.includes(c)){
      continue;
    }

    let headOfLocalHierarchy = data;

    let lowestScoreViaAnySeenCharacter = 9999999;

    let thisCharName = decodeName(charmap.characters[c]["name"]);

    let bestConnection = attemptToFindConnection_BFS(data.name, thisCharName);
    let origBestScore = bestConnection.score;

    if (bestConnection.path == null){
      continue;
    }

    lowestScoreViaAnySeenCharacter = bestConnection.score;

    let numUnseenCharactersInCurrentBestPath = 0;
    bestConnection.path.forEach(step => {
      if (!seen_chars.includes(step.chr)){
        numUnseenCharactersInCurrentBestPath++;
      }
    });

    let numUnseenEpisodesInCurrentBestPath = 0;
    bestConnection.path.forEach(step => {
      if (!seen_eps.includes(step.ep)){
        numUnseenEpisodesInCurrentBestPath++;
      }
    });

    for (let seenIndex = 0; seenIndex < seen_chars.length; seenIndex++){
      let seenCharId = seen_chars[seenIndex];
      let conn = attemptToFindConnection_BFS(decodeName(charmap.characters[seenCharId].name), thisCharName);

      if (conn.path == null || conn.score == -1){
        continue;
      }

      let potential_best_score = char_objs_by_id[String(seenCharId)].score + conn.score;

      if (potential_best_score <= lowestScoreViaAnySeenCharacter){
        if (potential_best_score == lowestScoreViaAnySeenCharacter){
            let numUnseenCharactersInCandidatePath = 0; //we want to minimise this
            conn.path.forEach(step => {
              if (!seen_chars.includes(step.chr)){
                numUnseenCharactersInCandidatePath++;
              }
            });
            if (numUnseenCharactersInCandidatePath >= numUnseenCharactersInCurrentBestPath){ //if it's not an improvement, don't use it
              continue;
            }
            let numUnseenEpisodesInCandidatePath = 0; //we want to minimise this
            conn.path.forEach(step => {
              if (!seen_eps.includes(step.ep)){
                numUnseenEpisodesInCandidatePath++;
              }
            });
            if (numUnseenEpisodesInCandidatePath >= numUnseenEpisodesInCurrentBestPath){ //if it's not an improvement, don't use it
              continue;
            }
        }

        bestConnection = conn;
        lowestScoreViaAnySeenCharacter = potential_best_score;
        headOfLocalHierarchy = char_objs_by_id[String(seenCharId)];
        numUnseenCharactersInCurrentBestPath = 0;
        bestConnection.path.forEach(step => {
            if (!seen_chars.includes(step.chr)){
              numUnseenCharactersInCurrentBestPath++;
          }
        });
        numUnseenEpisodesInCurrentBestPath = 0;
        bestConnection.path.forEach(step => {
            if (!seen_eps.includes(step.ep)){
              numUnseenEpisodesInCurrentBestPath++;
          }
        });
      }
    }

    if (bestConnection.path == null){
      console.log("No connection")
      continue;
    }

    let reverseConnection = bestConnection.path.reverse();

    let hierarchy = {};

    for (let i = 0; i < reverseConnection.length; i++){
        let step = reverseConnection[i];
        
        let chr_obj = null;

        if (seen_chars.includes(step.chr)){
          char_objs_by_id[String(step.chr)].children.push(hierarchy);
          break;
        } else {
          seen_chars.push(step.chr)
          chr_obj = {name: decodeName(charmap.characters[step.chr].name), isEp:false, children: Object.keys(hierarchy).length == 0 ? [] : [hierarchy]}
          chr_obj.score = origBestScore - i;
          char_objs_by_id[String(step.chr)] = chr_obj;
          hierarchy = chr_obj;
        }

        let ep_obj = null;

        if (seen_eps.includes(step.ep)){
          episode_objs_by_id[String(step.ep)].children.push(hierarchy);   
          break;
        } else {
          seen_eps.push(step.ep);
          ep_obj = {name:decodeName(charmap.episodes[step.ep].episode), isEp:true, children: Object.keys(hierarchy).length == 0 ? [] : [hierarchy]};          
          episode_objs_by_id[String(step.ep)] = ep_obj;
          hierarchy = ep_obj;
        }

        if (i == reverseConnection.length - 1){
          headOfLocalHierarchy.children.push(hierarchy);
        }
    }

    if (index > MAX_LOOPS){
      break;
    }
  }

  temporary_blacklist = [];
  console.log(data)

    // Compute the graph and start the force simulation.
    const root = d3.hierarchy(data);
    const links = root.links();
    const nodes = root.descendants();
  
    // Specify the chart’s dimensions.
    const width = window.innerWidth * root.height / 5;
    const height = window.innerWidth * root.height / 5;

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(0).strength(1))
        .force("charge", d3.forceManyBody().strength(-6000))
        .force("x", d3.forceX())
        .force("y", d3.forceY());
  
    // Create the container SVG.
    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-width / 2, -height / 2, width, height])
        .attr("style", "font-size:1.5em;font-weight:bold;");
  
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
    .attr("r", 10)
    .attr("fill", (d)=>{return d.data.isEp ? "white" : "black"})
    .attr("stroke", (d)=>{return d.data.isEp ? "black" : "white"});
  
  node.append("text")
    .text(d => {let removeParenttheses = d.data.name.split("(")[0]; return removeParenttheses.includes(" ") ? removeParenttheses.split(" ")[0] : "";})
    .attr("transform", (d) => `translate(${0} ${-50})`)
    .attr("style", (d)=>"white-space:break-spaces; user-select:none;text-transform:"+(d.data.isEp ? "uppercase" : "inherit"))
    .attr("fill", "black")
    .attr("stroke", "white")
    .attr("text-anchor","middle");

  node.append("text")
    .text(d => {let removeParenttheses = d.data.name.split("(")[0]; return removeParenttheses.substring(d.data.name.indexOf(' ')+1)})
    .attr("transform", (d) => `translate(${0} ${-25})`)
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

    simulation.on("tick", () => {
      if (Date.now() >= endTime){
        simulation.stop();

        let flattenedData = []

        root.each((n)=>flattenedData.push([n.x,n.y]));

        let delaunay = d3.Delaunay.from(flattenedData)
        let voronoi = delaunay.voronoi([-width, -height, width, height])
        
        for (let i = 0; i < flattenedData.length; i++) {
          let item = svg.append("path")
          .attr("fill", "white")
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

start();