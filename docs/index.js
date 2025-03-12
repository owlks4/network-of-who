let character_names_blacklist = ["Dalek","Daleks","Cyberman","Cybermen","Cyber-Leader","Major","Silurian","Sontaran","Sea Devil","Judoon","Slitheen","Zygon","Ice Warrior","Auton","Weeping Angel","Ood","Silas Carson","Roy_Skelton","Major"]

let optional_doctor_blacklist = ["The_Doctor","First_Doctor","Second_Doctor","Third_Doctor","Fourth_Doctor","Fifth_Doctor","Sixth_Doctor","Seventh_Doctor","Eighth_Doctor","War_Doctor","Ninth_Doctor","Tenth_Doctor","Eleventh_Doctor","Twelfth_Doctor","Thirteenth_Doctor","Fugitive_Doctor","Fourteenth_Doctor","Fifteenth_Doctor"]

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
  alert("When you exclude the Doctor, I think the longest connection between any two characters is 8, from:\n\n• any character exclusive to Class who was NOT in 'For Tonight we Might Die' (e.g. Dorothea Ames)\n\nTO\n\n• any character who only appeared in 'The Deadly Assassin' (e.g. Spandrell)\n\nAnother good shout is Mission to the Unknown, but it tends to have a slightly lower score due to some easy New Who connections to the 60s, like Ian Chesterton.\n\nWhen not using the Doctor, Mission to the Unknown is probably your best bet. As of writing this, you can even get 5th degree, Doctor-inclusive connections between Mission to the Unknown and Joy to the World, though I imagine that will change as the Fifteenth Doctor becomes better-connected.")
}

async function start(){
  const response = await fetch("charmap.json");
  charmap = await response.json();
  establishAutocomplete(charaA, charmap.characters);
  establishAutocomplete(charaB, charmap.characters);
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
  name = encodeURIComponent(name.replaceAll(" ","_"))
  let characters = charmap.characters;  
  for (let i = 0; i < characters.length; i++){
      let character = characters[i];
      if (character.name == name){
          return i;
        }      
  }
  return null
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

    blacklist = character_names_blacklist.map((x) => {return get_char_ID_by_name(x)});

    if (document.getElementById("blacklist-the-doctor").checked){
      blacklist = blacklist.concat(optional_doctor_blacklist.map((x) => {return get_char_ID_by_name(x)}));
    }

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

    console.log("Finished BFS loop")

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

start();