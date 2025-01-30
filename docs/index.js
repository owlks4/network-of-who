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
   let connection = attemptToFindConnection(charaA.value.trim(), charaB.value.trim(), false);
   document.getElementById("report").innerHTML = get_verbose_report(connection);
};

let charaA = document.getElementById("character-A");
let charaB = document.getElementById("character-B");

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

function attemptToFindConnection(a, b, verbose){

    let characters = charmap.characters;  
    let episodes = charmap.episodes;

    blacklist = character_names_blacklist.map((x) => {return get_char_ID_by_name(x)});

    if (document.getElementById("blacklist-the-doctor").checked){
      blacklist = blacklist.concat(optional_doctor_blacklist.map((x) => {return get_char_ID_by_name(x)}));
    }

    let IDs = convertDecodedNamesToIDs(a,b);
    
    let start = IDs[0];
    let end = IDs[1];    

    if (start == -1 || end == -1){
      return {
        "start":start,
        "end":end,
        "score":-1,
        "path":null
      }
    }

    let complete = false

    if (start == end){
      if (verbose){
        console.log("Start and end are the same person")
      }
      return {
        "start":start,
        "end":end,
        "score":0,
        "path":[{"ep":characters[start]["episodes"][0], "chr":start}]}
    }

    let dijkstra_context = {} //stores arrays in format [dist, prev, episode_id_where_connection_was_made, has_been_focal_node]

    dijkstra_context[String(start)] = [0,-1,-1, false]
    let node = start
    let curdist = 0

    if (blacklist.includes(end)){
      console.log("Intended endpoint '"+characters[end]["name"]+"' was in blacklist; will skip.")
      return {
        "start":start,
        "end":end,
        "score":-1,
        "path":"blacklist"
      }
    }
    else {
        while (!complete){
            
            //console.log("Focal node is "+String(node))

            if (curdist == 0){
              curdist = 1;
            } else {
              curdist = dijkstra_context[String(node)][0] + 1
            }            
            
            let chars_to_expand = []

            dijkstra_context[String(node)][3] = true

            if (verbose){
              console.log("Expanding "+characters[node]["name"])
              console.log(dijkstra_context[node])
            }            

            let local_char_to_ep_map = {}

            if (verbose){
              console.log("Looking at their episodes...")
            }

            characters[node]["episodes"].forEach(episode => {
              if (verbose){
               // console.log("Looking at "+episodes[episode].episode)
              }
              episodes[episode]["chars"].forEach(c => {
                if (verbose){
                 // console.log("Taking stock of character "+characters[c].name);
                 // console.log("Will we include it? Answer is: "+String(!Object.keys(dijkstra_context).includes(String(c)) && !chars_to_expand.includes(c)))
                }
                if (!Object.keys(dijkstra_context).includes(String(c)) && !chars_to_expand.includes(c)){
                  local_char_to_ep_map[String(c)] = episode
                  chars_to_expand.push(c)
                }
              })   
            });
            
            if (verbose){
              console.log("Registering nodes linked to them via their episodes...")
            }

            for (let i = 0; i < chars_to_expand.length; i++){
              let char = chars_to_expand[i];
              if (verbose){
               // console.log("Registering "+characters[char].name)
              }
              if (!blacklist.includes(char)){
                dijkstra_context[String(char)] = [curdist, node, local_char_to_ep_map[String(char)], false]
                if (char == end){
                  complete = true
                  break
                }
              }
            }

            if (verbose){
              console.log("Pool:")
              console.log(Object.keys(dijkstra_context).map(x => characters[x].name))
            }

            if (complete){
              break;
            }              

            let lowest_dist = 999999    

            if (verbose){
              console.log("Considering which to expand next...")
            }            

            node = null            

            Object.keys(dijkstra_context).forEach(potential_next_node => {
              node_object = dijkstra_context[potential_next_node];
              if (verbose){
                //console.log("Considering expanding to:")
                //console.log(characters[parseInt(potential_next_node)].name);
              }              
              if (node_object[0] < lowest_dist && !node_object[3] && node_object[1] != -1 && !blacklist.includes(parseInt(potential_next_node))){
                  node = parseInt(potential_next_node)
                  lowest_dist = node_object[0]            
              }                
            });
            
            if (node == null){
              console.log("Could not move to an adjacent node!")
              break
            }
            
            if (verbose){
              console.log("Choosing " + characters[node].name +" due to lowest dist of "+lowest_dist)
            }            
          }
    }

    if (verbose){
      console.log("Finished")
    }
    
    if (!complete){
      if (verbose){
        let failure_text = "Could not link "+decodeName(characters[start]["name"]) + " to "+decodeName(characters[end]["name"])
        console.log(failure_text)        
      }
      return {
        "start":start,
        "end":end,
        "score":-1,
        "path":null}
    }

    let output = ""
    let char_id = end
    node = dijkstra_context[String(char_id)]
    let first_time = true

    let score = 0
    let p = []

    while (node[1] != -1){
      p.push({"ep":node[2], "chr":char_id})
      score += 1
      output = " was in " + trim_story_url(decodeName(episodes[node[2]]["episode"])) + " with " + decodeName(characters[char_id]["name"]) + (first_time ? "" : ", who") + output
      first_time = false
      char_id = node[1]
      node = dijkstra_context[String(char_id)]
    }
        
    output = decodeName(characters[start]["name"]) + output

    return {
        "start":start,
        "end":end,
        "score":score,
        "path":p.reverse()
      }
}

start();