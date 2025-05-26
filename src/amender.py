import json
from urllib.parse import unquote, quote

print("Now running the amender (amends specific episodes and characters into charmap.json without having to regenerate the entire file from the wiki.)")

charmap = json.loads(open("charmap.json", encoding="utf-8").read())

def sanitise_name(original):
    return unquote(original).replace("(TV_story)","").replace("(tv_story)","").replace("_"," ").strip()

def add_character(name):
    chara_already_exists = False

    sanitised_name = sanitise_name(name)
    existing = None

    for character in charmap["characters"]:
        if sanitise_name(character["name"]) == sanitised_name:
            chara_already_exists = True
            existing = character
            break

    if chara_already_exists:
        print("Won't add "+sanitised_name+" anew, because they already existed")
        return existing
    else:
        existing = {"name":name.replace(" ","_"), "episodes":[]}
        charmap["characters"].append(existing)
        return existing

def add_episode(episode_name, year, character_names):
    sanitised_episode_name = sanitise_name(episode_name)

    episode = {"episode":episode_name.replace(" ","_"), "chars":[]}
    episode_has_yet_to_be_appended = True
    episode_id = len(charmap["episodes"])

    print("Attempted to add episode, characters and connections: "+sanitised_episode_name)

    for existing_episode in charmap["episodes"]:
        if sanitise_name(existing_episode["episode"]) == sanitised_episode_name:
            episode = existing_episode
            episode_id = charmap["episodes"].index(existing_episode)
            episode_has_yet_to_be_appended = False
    
    episode["y"] = str(year)

    for character_name in character_names:
        chara_object = add_character(character_name)
        if not episode_id in chara_object["episodes"]:
            chara_object["episodes"].append(episode_id)
        chara_id = charmap["characters"].index(chara_object)
        if not chara_id in episode["chars"]:
            episode["chars"].append(chara_id)

    if episode_has_yet_to_be_appended:
        charmap["episodes"].append(episode)

########################################################
# Put your amendments here, using add_episode():
#######################################################

print("Processing amendments...")

add_episode("Wish_World_(TV_story)", "2025", [
    "Seeker_(Wish_World)",
    "Drone_Guard"
    ])

print("Done")

for episode in charmap["episodes"]:
    episode["chars"].sort()

json_string = json.dumps(charmap)
open("charmap.json", encoding="utf-8", mode="w+").write(json_string)
open("../docs/charmap.json", encoding="utf-8", mode="w+").write(json_string)