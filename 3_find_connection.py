import json
from urllib.parse import unquote
from random import randint

blacklist = []#"Dalek","Daleks","Cyberman","Cybermen","First_Doctor","Second_Doctor","Third_Doctor","Fourth_Doctor","Fifth_Doctor","Sixth_Doctor","Seventh_Doctor","Eighth_Doctor","War_Doctor","Ninth_Doctor","Tenth_Doctor","Eleventh_Doctor","Twelfth_Doctor","Thirteenth_Doctor","Fugitive_Doctor","Fourteenth_Doctor","Fifteenth_Doctor"]

FOREVER_BLACKLIST = [""]

blacklist.extend(FOREVER_BLACKLIST)

data = json.loads(open("charmap.json", mode="r", encoding="utf-8").read())

episodes = data["episodes"]
characters = data["characters"]

def get_char_by_name(name):
    for character in characters:
        if character["name"] == name:
            return character
    return None

def fix_name(input):
    return unquote(input).replace("_"," ")

verbose = False

def find_connection(start,end):
    complete = False

    if start == end:
        if verbose:
            print("Start and end are the same person")
        return {"start":start,"end":end,"score":0,"path":[{"ep":characters[start]["episodes"][0], "chr":start}]}

    dijkstra_context = {} # stores arrays in format [dist, prev, episode_id_where_connection_was_made, has_been_focal_node]

    dijkstra_context[str(start)] = [0,-1,-1, False]
    node = start
    curdist = -1

    while not complete:
        
        #print("Focal node is "+str(node))

        if curdist == -1:
            curdist = 0
        else:
            curdist = dijkstra_context[str(dijkstra_context[str(node)][1])][0] + 1

        chars_to_expand = []

        dijkstra_context[str(node)][3] = True

        if verbose:
            print("Expanding "+characters[node]["name"])

        local_char_to_ep_map = {}

        #print("Looking at their episodes...")

        for episode in characters[node]["episodes"]:
            for c in episodes[episode]["chars"]:
                if not str(c) in dijkstra_context.keys() and not c in chars_to_expand:
                    local_char_to_ep_map[str(c)] = episode
                    chars_to_expand.append(c)

        #print("Registering nodes linked to them via their episodes...")

        for char in chars_to_expand:
            dijkstra_context[str(char)] = [curdist, node, local_char_to_ep_map[str(char)], False]
            if char == end:
                complete = True
                break

        if complete:
            break

        lowest_dist = 999999    

        #print("Considering which to expand next...")

        node = None

        for potential_next_node in dijkstra_context.keys():
            node_object = dijkstra_context[potential_next_node]
            if node_object[0] < lowest_dist and not node_object[3] and not node_object[1] == -1 and not (characters[int(potential_next_node)]["name"] in blacklist):
                node = int(potential_next_node)
                lowest_dist = node_object[0]

        if node == None:
            print("Could not move to an adjacent node!")
            break
        
        #print("Choosing "+str(node))

    if verbose:
        print("Finished")

    if not complete:
        if verbose:
            failure_text = "Could not link "+fix_name(characters[start]["name"]) + " to "+fix_name(characters[end]["name"])
            print(failure_text)
        return {"start":start,"end":end,"score":-1,"path":None}

    output = ""
    char_id = end
    node = dijkstra_context[str(char_id)]
    first_time = True

    score = 0
    p = []

    while not node[1] == -1:
        p.append({"ep":node[2], "chr":char_id})
        score += 1
        output = " was in " + fix_name(episodes[node[2]]["episode"]).split("/wiki/")[-1].split("(")[0].strip() + " with " + fix_name(characters[char_id]["name"]) + ("" if first_time else ", who") + output
        first_time = False
        char_id = node[1]
        node = dijkstra_context[str(char_id)]
    output = fix_name(characters[start]["name"]) + output

    if verbose:
        print("\n"+fix_name(characters[start]["name"]) + " has a "+fix_name(characters[end]["name"]) +" score of " + str(score)+":\n"+output+"\n")

    return {
        "start":start,
        "end":end,
        "score":score,
        "path":list(reversed(p))
    }

_START = characters.index(get_char_by_name("Areta"))
_END = characters.index(get_char_by_name("Christofer_Ibrahim"))

def randomise_start_and_end():
    global _START, _END
    _START = randint(0, len(characters) - 1)
    _END = randint(0, len(characters) - 1)

lowest = {"score": 99999}
highest = {"score": -99999}

for i in range (20000):
    print(str(i))
    randomise_start_and_end()
    connection = find_connection(_START,_END)
    if connection["score"] < lowest["score"]:
        lowest = connection
    if connection["score"] > highest["score"]:
        highest = connection

def get_report(connection):
    return characters[connection["start"]]["name"] +" -> "+characters[connection["end"]]["name"] + ": "+str(connection["score"])

print(get_report(lowest))
print(get_report(highest))