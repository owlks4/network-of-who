import json
import zipfile
from urllib.parse import unquote, quote
import os

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
        existing = {"name":name.replace(" ","_"), "eps":[]}
        charmap["characters"].append(existing)
        return existing

def add_episode(episode_name, year, character_names):
    sanitised_episode_name = sanitise_name(episode_name)

    episode = {"ep":episode_name.replace(" ","_"), "chars":[]}
    episode_has_yet_to_be_appended = True
    episode_id = len(charmap["eps"])

    print("Attempted to add episode, characters and connections: "+sanitised_episode_name)

    for existing_episode in charmap["eps"]:
        if sanitise_name(existing_episode["ep"]) == sanitised_episode_name:
            episode = existing_episode
            episode_id = charmap["eps"].index(existing_episode)
            episode_has_yet_to_be_appended = False
    
    if not year == None:
        year -= 1963

    episode["y"] = -1 if year == None else year

    for character_name in character_names:
        chara_object = add_character(character_name)
        if not episode_id in chara_object["eps"]:
            chara_object["eps"].append(episode_id)
        chara_id = charmap["characters"].index(chara_object)
        if not chara_id in episode["chars"]:
            episode["chars"].append(chara_id)

    if episode_has_yet_to_be_appended:
        charmap["eps"].append(episode)

########################################################
# Put your amendments here, using add_episode():
#######################################################

print("Processing amendments...")

add_episode("The_Reality_War_(TV_story)", 2025, [
    "Sixteenth_Doctor?"
    ])

print("Done")

for episode in charmap["eps"]:
    episode["chars"].sort()
    if type(episode["y"]) is str and episode["y"].isnumeric():
        episode["y"] = int(episode["y"])
        if episode["y"] > 1000:
            episode["y"] -= 1963

json_string = json.dumps(charmap, separators=(',', ':'))

open("charmap.json", encoding="utf-8", mode="w+").write(json_string)

if os.path.exists("../docs/charmap.zip"):
    os.remove("../docs/charmap.zip")

with zipfile.ZipFile('../docs/charmap.zip', 'w') as myzip:
    myzip.write('charmap.json', compress_type=zipfile.ZIP_DEFLATED)