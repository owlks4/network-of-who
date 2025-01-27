import json
from urllib.parse import unquote, quote
from random import randint
import os

blacklist = ["Dalek","Daleks","Cyberman","Cybermen","Cyber-Leader","Judoon","Slitheen","Zygon","Ice Warrior","Auton","Weeping Angel"]#,"First_Doctor","Second_Doctor","Third_Doctor","Fourth_Doctor","Fifth_Doctor","Sixth_Doctor","Seventh_Doctor","Eighth_Doctor","War_Doctor","Ninth_Doctor","Tenth_Doctor","Eleventh_Doctor","Twelfth_Doctor","Thirteenth_Doctor","Fugitive_Doctor","Fourteenth_Doctor","Fifteenth_Doctor"]

FOREVER_BLACKLIST = [""]

blacklist.extend(FOREVER_BLACKLIST)

data = json.loads(open("charmap.json", mode="r", encoding="utf-8").read())

episodes = data["episodes"]
characters = data["characters"]

verbose = False

def get_char_by_name(name):
    name = quote(name.replace(" ","_"), safe="()")
    for character in characters:
        if character["name"] == name:
            return character
    return None

def get_episode_by_name(name):
    name = fix_name(trim_story_url(name))
    for episode in episodes:
        if fix_name(trim_story_url(episode["episode"])) == name:
            return episode
    return None

def fix_name(input):
    return unquote(input).replace("_"," ").strip()

def trim_story_url(input):
    return input.split("/wiki/")[-1].split("(")[0].strip()

def print_episodes_for_character(chara):
    print("\n"+fix_name(chara["name"])+"'s episodes:\n")
    print(list(map(lambda x : episodes[x]["episode"], chara["episodes"])))

def print_characters_for_episode(episode):
    print("\n"+fix_name(trim_story_url(episode["episode"]))+"'s characters:\n")
    print(list(map(lambda x : characters[x]["name"], episode["chars"])))


def get_report(connection):
    return fix_name(characters[connection["start"]]["name"]) +" -> "+ fix_name(characters[connection["end"]]["name"]) + ": "+str(connection["score"])

def get_verbose_report(connection):    
    path = connection["path"]

    if path == None:
        return fix_name(characters[connection["start"]]["name"]) + " could not be connected to " + fix_name(characters[connection["end"]]["name"])

    output = fix_name(characters[connection["start"]]["name"]) + " has a "+ fix_name(characters[connection["end"]]["name"]) +" score of " + str(connection["score"]) +".\n\n"

    output += fix_name(characters[connection["start"]]["name"]) +" was in "

    i = 0
    for point in path:
        output += trim_story_url(fix_name(episodes[point["ep"]]["episode"])) + " with " + fix_name(characters[point["chr"]]["name"])
        i += 1
        if i < len(path):
            output += ", who was in "
    return output + "."

def get_chars_in_episode_once_blacklist_removed(episode):
    output = []
    chars = episode["chars"]
    for char in chars:
        if not characters[char]["name"] in blacklist:
            output.append(char)
    return output

unreachable_characters = []

for episode in episodes:
    available_chars_in_episode = get_chars_in_episode_once_blacklist_removed(episode)
    if len(available_chars_in_episode) == 1:
        the_only_character = available_chars_in_episode[0]
        if len(characters[the_only_character]["episodes"]) == 1:            
            unreachable_characters.append(the_only_character)

print("Unreachable characters (starring only in one episode and are the only person in that episode):")
print(list(map(lambda x : characters[x]["name"], unreachable_characters)))

episodes_and_traversals = {}
characters_and_traversals = {}

watched_episode = "The End of Time"
watched_episode_id = episodes.index(get_episode_by_name(watched_episode))
characters_accessed_when_traversing_the_watched_episode = {}

total_num_connections_completed = 0

def find_connection(start,end):
    global total_num_connections_completed

    complete = False

    if start == end:
        if verbose:
            print("Start and end are the same person")
        return {"start":start,"end":end,"score":0,"path":[{"ep":characters[start]["episodes"][0], "chr":start}]}

    dijkstra_context = {} # stores arrays in format [dist, prev, episode_id_where_connection_was_made, has_been_focal_node]

    dijkstra_context[str(start)] = [0,-1,-1, False]
    node = start
    curdist = 0

    if characters[end]["name"] in blacklist:
        print("Intended endpoint '"+characters[end]["name"]+"' was in blacklist; will skip.")
    else:
        while not complete:
            
            #print("Focal node is "+str(node))

            if curdist == 0:
                curdist = 1
            else:
                curdist = dijkstra_context[str(node)][0] + 1

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
                if not characters[char]["name"] in blacklist:
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
                if node_object[0] < lowest_dist and not node_object[3] and not node_object[1] == -1 and not characters[int(potential_next_node)]["name"] in blacklist:
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
        ep_id = node[2]
        
        #just some housekeeping to track statistics:
        if ep_id in episodes_and_traversals:
            episodes_and_traversals[ep_id] += 1
        else:
            episodes_and_traversals[ep_id] = 1

        if char_id in characters_and_traversals:
            characters_and_traversals[char_id] += 1
        else:
            characters_and_traversals[char_id] = 1

        if str(watched_episode_id) == str(ep_id):
            if str(char_id) in characters_accessed_when_traversing_the_watched_episode.keys():
                characters_accessed_when_traversing_the_watched_episode[str(char_id)] += 1
            else:
                characters_accessed_when_traversing_the_watched_episode[str(char_id)] = 1

        #now back to the actual path construction for this node:

        p.append({"ep":ep_id, "chr":char_id})

        score += 1
        output = " was in " + trim_story_url(fix_name(episodes[ep_id]["episode"])) + " with " + fix_name(characters[char_id]["name"]) + ("" if first_time else ", who") + output
        first_time = False
        char_id = node[1]
        node = dijkstra_context[str(char_id)]
    output = fix_name(characters[start]["name"]) + output

    total_num_connections_completed += 1

    return {
        "start":start,
        "end":end,
        "score":score,
        "path":list(reversed(p))
    }

def test_random_connections(num):
    print("Rolling "+str(num) +" random connections:")

    lowest = {"score": 99999}
    highest = {"score": -99999}

    for i in range(num):
        randomise_start_and_end()
        connection = find_connection(_START,_END)
        print(str(i)+": "+get_report(connection))
        score = connection["score"] 
        if score < lowest["score"] and score >= 0:
            lowest = connection
        if score > highest["score"]:
            highest = connection

    print("\nLowest:")
    print(get_report(lowest))
    print(get_verbose_report(lowest))

    print("\nHighest (not counting infinity):")
    print(get_report(highest))
    print(get_verbose_report(highest))

def make_average_score_csv():
    print("\nWARNING: This will take ages!\n")
    if os.path.isfile("average_distance_per_character.csv"):
        os.remove("average_distance_per_character.csv")

    averages = open("average_distance_per_character.csv", mode="a+", encoding="utf-8")

    for i in range(len(characters)):
        avg = 0
        count = 0
        print("Looking at "+characters[i]["name"])
        for j in range(len(characters)):
            if i == j:
                continue
            connection = find_connection(i,j)
            score = connection["score"]
            if not score == -1:
                avg += score
                count += 1
        avg /= count
        averages.write(fix_name(characters[i]["name"]) +","+str(avg)+"\n")

_START = characters.index(get_char_by_name("Fugitive_Doctor"))
_END = characters.index(get_char_by_name("Kate_Stewart"))

def randomise_start_and_end():
    global _START, _END
    _START = randint(0, len(characters) - 1)
    _END = randint(0, len(characters) - 1)

print(get_verbose_report(find_connection(_START,_END)))

test_random_connections(20000)

def print_stats():
    print("\nTop 100 most traversed episodes after "+str(total_num_connections_completed)+" successful connections:\n")
    print(list(map(lambda x : trim_story_url(fix_name(episodes[int(x)]["episode"])) + ": " + str(episodes_and_traversals[x]), sorted(episodes_and_traversals, reverse=True, key = lambda x : episodes_and_traversals[x])))[:100 if total_num_connections_completed >= 100 else total_num_connections_completed])

    print("\nTop 100 most traversed characters after "+str(total_num_connections_completed)+" successful connections:\n")
    print(list(map(lambda x : fix_name(characters[int(x)]["name"]) + ": " + str(characters_and_traversals[x]), sorted(characters_and_traversals, reverse=True, key = lambda x : characters_and_traversals[x])))[:100 if total_num_connections_completed >= 100 else total_num_connections_completed])

    print("\nMost traversed characters when traversing the watched episode ("+trim_story_url(fix_name(episodes[watched_episode_id]["episode"]))+"):")
    print(list(map(lambda x : fix_name(characters[int(x)]["name"]) + ": " + str(characters_accessed_when_traversing_the_watched_episode[x]), sorted(characters_accessed_when_traversing_the_watched_episode, reverse=True, key = lambda x : characters_accessed_when_traversing_the_watched_episode[x])[:100 if len(characters_accessed_when_traversing_the_watched_episode) >= 100 else len(characters_accessed_when_traversing_the_watched_episode)])))

print_stats()

#make_average_score_csv()