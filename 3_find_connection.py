import json
from urllib.parse import unquote

blacklist = ["Dalek","Daleks","Cyberman","Cybermen","First_Doctor","Second_Doctor","Third_Doctor","Fourth_Doctor","Fifth_Doctor","Sixth_Doctor","Seventh_Doctor",
             "Eighth_Doctor","War_Doctor","Ninth_Doctor","Tenth_Doctor","Eleventh_Doctor","Twelfth_Doctor","Thirteenth_Doctor","Fugitive_Doctor","Fourteenth_Doctor",
             "Fifteenth_Doctor"]

FOREVER_BLACKLIST = ["Captain", "Lieutenant", "Dalek_operator", "Colonel", "Commander"]

blacklist.extend(FOREVER_BLACKLIST)

complete = False

data = json.loads(open("charmap.json", mode="r", encoding="utf-8").read())

episodes = data["episodes"]
characters = data["characters"]

def get_char_by_name(name):
    for character in characters:
        if character["name"] == name:
            return character
    return None

START = characters.index(get_char_by_name("Mels_Zucker")) #characters.index(get_char_by_name("Areta"))
END = characters.index(get_char_by_name("Adric")) #characters.index(get_char_by_name("Christofer_Ibrahim"))

dijkstra_context = {} # stores arrays in format [dist, prev, episode_id_where_connection_was_made, has_been_focal_node]

dijkstra_context[str(START)] = [0,-1,-1, False]
node = START
curdist = -1

while not complete:
    
    print("Focal node is "+str(node))
    print(dijkstra_context)

    if curdist == -1:
        curdist = 0
    else:
        curdist = dijkstra_context[str(dijkstra_context[str(node)][1])][0] + 1

    chars_to_expand = []

    dijkstra_context[str(node)][3] = True

    print("Expanding "+characters[node]["name"])

    local_char_to_ep_map = {}

    print("Looking at their episodes...")

    for episode in characters[node]["episodes"]:
        for c in episodes[episode]["chars"]:
            if not str(c) in dijkstra_context.keys() and not c in chars_to_expand:
                local_char_to_ep_map[str(c)] = episode
                chars_to_expand.append(c)

    print("Registering nodes linked to them via their episodes...")

    for char in chars_to_expand:
        dijkstra_context[str(char)] = [curdist, node, local_char_to_ep_map[str(char)], False]
        if char == END:
            complete = True
            break

    if complete:
        break

    lowest_dist = 999999    

    print("Considering which to expand next...")

    for potential_next_node in dijkstra_context.keys():
        node_object = dijkstra_context[potential_next_node]
        if node_object[0] < lowest_dist and not node_object[3] and not node_object[1] == -1 and not (characters[int(potential_next_node)]["name"] in blacklist):
            node = int(potential_next_node)
            lowest_dist = node_object[0]
    
    print("Choosing "+str(node))

print("Finished")

output = ""
char_id = END
node = dijkstra_context[str(char_id)]
first_time = True
while not node[1] == -1:
    output = " was in " + unquote(episodes[node[2]]["episode"]).replace("_"," ").split("/wiki/")[1].split("(")[0].strip() + " with " + unquote(characters[char_id]["name"]).replace("_"," ") + ("" if first_time else ", who") + output
    first_time = False
    char_id = node[1]
    node = dijkstra_context[str(char_id)]
output = unquote(characters[START]["name"]).replace("_"," ") + output

print(output)