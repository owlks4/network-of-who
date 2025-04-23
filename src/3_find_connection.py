import json
from urllib.parse import unquote, quote
from random import randint
import os
import datetime

# N.B. the blacklist gets turned into a list of IDs a few lines after this.
blacklist = ["Dalek","Daleks","Cyberman","Cybermen","Cyber-Leader","Major","Judoon","Slitheen","Zygon","Ice_Warrior","Auton","Weeping_Angel","First_Doctor","Second_Doctor","Third_Doctor","Fourth_Doctor","Fifth_Doctor","Sixth_Doctor","Seventh_Doctor","Eighth_Doctor","War_Doctor","Ninth_Doctor","Tenth_Doctor","Eleventh_Doctor","Twelfth_Doctor","Thirteenth_Doctor","Fugitive_Doctor","Fourteenth_Doctor","Fifteenth_Doctor"]

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

for i in range(len(blacklist)): #turn blacklist into a list of IDs for fast access during the BFS algorithm
    character = get_char_by_name(blacklist[i])
    if not character == None:
        blacklist[i] = characters.index(character)
    else:
        blacklist[i] = None

blacklist = list(filter(lambda x : not x == None, blacklist))

characters_with_blacklisted_chars_as_none = characters.copy()

for blacklisted_ID in blacklist:
    characters_with_blacklisted_chars_as_none[blacklisted_ID] = None

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
        if not char in blacklist:
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

def get_episode_ID_in_common(c1, c2):
    for episode in characters[c1]["episodes"]:
        for other_episode in characters[c2]["episodes"]:
            if episode == other_episode:
                return episode
    return None

def find_connection_BFS(start,end):
    global total_num_connections_completed

    complete = False

    if start == end:
        if verbose:
            print("Start and end are the same person")
        return {"start":start,"end":end,"score":0,"path":[{"ep":characters[start]["episodes"][0], "chr":start}]}

    if start in blacklist:
        print("Intended start point '"+characters[start]["name"]+"' was in blacklist; will skip.")
        return {"start":start,"end":end,"score":-1,"path":None}

    if end in blacklist:
        print("Intended endpoint '"+characters[end]["name"]+"' was in blacklist; will skip.")
        return {"start":start,"end":end,"score":-1,"path":None}
    
    queue = [start]
    prevs = {}
    visited = [start]

    prevs[str(start)] = -1

    while not complete:

        if len(queue) == 0:
            if verbose:
                print("Exhausted all node adjacencies!")                        
            break

        node = queue.pop(0)

        if verbose:
            print("Expanding "+characters[node]["name"])

        for episode in characters[node]["episodes"]:
            #print("Looking at episode "+episodes[episode]["episode"])
            for c in episodes[episode]["chars"]:
                if not c in visited and not characters_with_blacklisted_chars_as_none[c] == None:
                    prevs[str(c)] = node
                    queue.append(c)
                    visited.append(c)
                    if c == end:
                        complete = True
                        break
            if complete:
                break

    if verbose:
        print("Finished BFS loop")

    if not complete:
        if verbose:
            failure_text = "Could not link "+fix_name(characters[start]["name"]) + " to "+fix_name(characters[end]["name"])
            print(failure_text)        
        return {"start":start,"end":end,"score":-1,"path":None}

    output = ""
    char_id = end
    first_time = True

    score = 0
    p = []

    while not prevs[str(char_id)] == -1:
        prev = prevs[str(char_id)]
        ep_id = get_episode_ID_in_common(prev, char_id)
        
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
        char_id = prev

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
        connection = find_connection_BFS(_START,_END)
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

    d = {}

    avg_for_character_in_episode_if_they_are_unique_to_that_episode = {}

    episodes_of_prev = []
    avg_of_prev = None

    for i in range(len(characters)):
        avg = 0
        count = 0
        chara = characters[i]
        print("Looking at "+chara["name"])
        
        if len(chara["episodes"]) == 1:
            the_only_ep = chara["episodes"][0]
            if str(the_only_ep) in avg_for_character_in_episode_if_they_are_unique_to_that_episode.keys(): #then grab it from the cache
                d[str(i)] = avg = avg_for_character_in_episode_if_they_are_unique_to_that_episode[str(the_only_ep)]
                print("Using the cache")
                count = -1 #and set this to -1 so that we know not to perform the loop

        if not count == -1:
            if sorted(chara["episodes"]) == episodes_of_prev: #if the episodes that this character is in is exactly the same as the previous character, just use the previous average
                avg = avg_of_prev
            else:
                for j in range(len(characters)):
                    if i == j:
                        continue            
                    connection = find_connection_BFS(i,j)
                    score = connection["score"]
                    if not score == -1:
                        avg += score
                        count += 1
                if count > 0:
                    avg /= count
                else:
                    avg = -1
            d[str(i)] = avg
            if not avg_of_prev == avg: #if we didn't calculate the avg from avg_of_prev, then clearly, the episodes for this character were different to that of the prev, so we need to update episodes_of_prev with a new value
                episodes_of_prev = sorted(chara["episodes"])
            avg_of_prev = avg
            
            if len(chara["episodes"]) == 1: #if this is true and yet we still got here, via the actual calculation loop, it's clear that the episode didn't have a key in the cache, so we make one now.
                avg_for_character_in_episode_if_they_are_unique_to_that_episode[str(chara["episodes"][0])] = avg

        open("average_distance_per_character.csv", mode="w+", encoding="utf-8").write("\n".join(list(map(lambda key : '"'+fix_name(characters[int(key)]["name"])+'",'+str(d[key]), d.keys()))))

def test_every_other_connection_from_character(id):
    d = {}
    avg = 0
    count = 0

    time_started = datetime.datetime.now()
 
    lowest = {"score": 99999}
    highest = {"score": -99999}

    out_of = "/"+str(len(characters))

    for i in range(len(characters)):
        if i == id:
            continue
        connection = find_connection_BFS(id,i)
        score = connection["score"]
        d[str(i)] = score
        if not score == -1:
            avg += score
            count += 1
        if score < lowest["score"] and score >= 0:
            lowest = connection
        if score > highest["score"]:
            highest = connection
        print(str(i)+out_of)
    avg /= count
    print(characters[id]["name"] +" had an average score of "+ str(avg) +" when tested against every other character.")

    print("TIME TAKEN: "+str(datetime.datetime.now() - time_started))

    print("\nTop 100 highest scoring connections for them after "+str(total_num_connections_completed)+" successful connections:\n")
    print(list(map(lambda x : fix_name(characters[int(x)]["name"]) + ": " + str(d[x]), sorted(d, reverse=True, key = lambda x : d[x])))[:100 if total_num_connections_completed >= 100 else total_num_connections_completed])
    
def randomise_start_and_end():
    global _START, _END
    _START = randint(0, len(characters) - 1)
    _END = randint(0, len(characters) - 1)

_START = characters.index(get_char_by_name("Lux_Imperator"))
_END = characters.index(get_char_by_name("Cherry_Sunday"))

print("\n")

print(get_verbose_report(find_connection_BFS(_START,_END)))

#test_random_connections(200)

#test_every_other_connection_from_character(characters.index(get_char_by_name("Goth")))

def print_stats():
    print("\nTop 100 most traversed episodes after "+str(total_num_connections_completed)+" successful connections:\n")
    print(list(map(lambda x : trim_story_url(fix_name(episodes[int(x)]["episode"])) + ": " + str(episodes_and_traversals[x]), sorted(episodes_and_traversals, reverse=True, key = lambda x : episodes_and_traversals[x])))[:100 if total_num_connections_completed >= 100 else total_num_connections_completed])

    print("\nTop 100 most traversed characters after "+str(total_num_connections_completed)+" successful connections:\n")
    print(list(map(lambda x : fix_name(characters[int(x)]["name"]) + ": " + str(characters_and_traversals[x]), sorted(characters_and_traversals, reverse=True, key = lambda x : characters_and_traversals[x])))[:100 if total_num_connections_completed >= 100 else total_num_connections_completed])

    print("\nMost traversed characters when traversing the watched episode ("+trim_story_url(fix_name(episodes[watched_episode_id]["episode"]))+"):")
    print(list(map(lambda x : fix_name(characters[int(x)]["name"]) + ": " + str(characters_accessed_when_traversing_the_watched_episode[x]), sorted(characters_accessed_when_traversing_the_watched_episode, reverse=True, key = lambda x : characters_accessed_when_traversing_the_watched_episode[x])[:100 if len(characters_accessed_when_traversing_the_watched_episode) >= 100 else len(characters_accessed_when_traversing_the_watched_episode)])))

#print_stats()

#make_average_score_csv()