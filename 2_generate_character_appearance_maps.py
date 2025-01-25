import requests
from lxml import html
from io import BytesIO
import time
import json

def parse_cast_list(episode):
    response = requests.get(ROOT_URL + episode)
    character_links = []
    with BytesIO(response.content) as f:
        page = f.read()
        tree = html.fromstring(page)
        uls = tree.findall(".//ul")
        for ul in uls:
            parent = ul.getparent()
            index = parent.index(ul)
            false_trail = False
            tries = 0
            while not parent[index].tag == "h2":
                index -= 1
                tries += 1
                if index < 0 or tries > 8: #only let it run for 8 subsequent elements (pretty lenient) before giving up and deciding this probably wasn't the actual cast list
                    false_trail = True
                    break
            if false_trail:
                continue

            if not (parent[index].text_content().strip().lower() == "cast"): #the most recent h2 tag must be the Cast h2.
                continue

            for li in ul:
                first_anchortag = li.find(".//a")
                if first_anchortag == None:
                    continue
                anchortag_parent = first_anchortag.getparent()
                if not "href" in str(html.etree.tostring(anchortag_parent), encoding="utf-8").split(" - ")[0]: # if the first part of the character name didn't contain a link
                    continue
                for tag in anchortag_parent:
                    if tag.tag == "a":
                        link = tag.attrib.get("href").split("/wiki/")[-1]
                        if not "redlink" in link and not "stunt_double" in link.lower():
                            character_links.append(link.split("/")[0].split("#")[0])
                    if not tag.tail == None and (" - " in tag.tail or "—" in tag.tail):
                        break
                    
    return character_links

ROOT_URL = "https://mirror.tardis.wiki/wiki/"

episode_links = open("episodes.txt", mode="r", encoding="utf-8").read().replace("\r","").split("\n")

episode_charmaps = []

characters = []

def process_characters(cast, episode_id):
    output = []
    for i in range(len(cast)):
        char = cast[i]
        char_lower = char.lower()
        match = None
        for entry in characters:
            if entry["name"].lower() == char_lower:
                match = entry
                break
        if match == None:
            characters.append({"name":char, "episodes":[episode_id]})
            output.append(len(characters) - 1)
        else:
            match["episodes"].append(episode_id)
            output.append(characters.index(match))
            
    return output

for episode in episode_links:
    cast = parse_cast_list(episode)
    print(cast)
    episode_charmaps.append({"episode":episode, "chars":process_characters(list(dict.fromkeys(cast)), episode_links.index(episode))}) #the list(dict.fromkeys()) part is there to remove duplicates in the list (e.g. if a character is repeated twice in the same cast list for whatever reason (e.g. two daleks) we only need to record one instance)
    time.sleep(1)
    open("charmap.json", mode="w+", encoding="utf-8").write(json.dumps({"episodes":episode_charmaps, "characters":characters}))