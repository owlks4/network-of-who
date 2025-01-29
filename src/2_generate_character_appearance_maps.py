import requests
from lxml import html
from io import BytesIO
import time
import json
import os
from random import shuffle

FOREVER_BLACKLIST = ["", "silurian","sontaran","sea devil", "dwm_284", "roy_skelton", "major", "captain", "brigadier", "professor", "lieutenant", "dalek_operator", "colonel", "commander", "trap_street", "covent_garden", "william_hartnell","patrick_troughton","jon_pertwee","tom_baker","peter_davison","colin_baker","sylvester_mccoy","paul_mcgann","john_hurt","christopher_eccleston","david_tennant","matt_smith","peter_capaldi","jodie_whittaker","jo_martin","ncuti_gatwa", "gabriel_woolf", "nicholas_briggs", "paul_kasey"] #some items I was having trouble with due to non-standard listing in the cast list, often due to being voice roles or 'introducing...'

OUTPUT_PATH = "charmap.json"
WEB_OUTPUT_PATH = "../docs/charmap.json"

if os.path.isfile(OUTPUT_PATH):
    print(OUTPUT_PATH + " already exists. If you really do want to regenerate it, please delete it first, then run this script again. Aborting for now.")
    exit()

def get_most_recent_tag_of_type(start_point, target_tag_type):
    parent = start_point.getparent()
    index = parent.index(start_point)
    false_trail = False
    tries = 0
    while not parent[index].tag == target_tag_type:
        index -= 1
        tries += 1
        if index < 0 or tries > 8: #only let it run for 8 subsequent elements (pretty lenient) before giving up and deciding this probably wasn't the actual cast list
            false_trail = True
            break
    if false_trail:
        return None
    return parent[index]

def parse_cast_list(episode):
    response = requests.get(ROOT_URL + episode)
    character_links = []
    with BytesIO(response.content) as f:
        page = f.read()
        tree = html.fromstring(page)
        uls = tree.findall(".//ul")
        ps = tree.findall(".//p")
        dls = tree.findall(".//dl")

        if not ps == None:
            uls.extend(ps)

        if not dls == None:
            uls.extend(dls)
        
        for ul in uls:
            most_recent_h2 = get_most_recent_tag_of_type(ul, "h2")
            if most_recent_h2 == None:
                continue

            most_recent_h2_contents = most_recent_h2.text_content().strip().lower()

            if not (most_recent_h2_contents == "cast" or most_recent_h2_contents == "cast (voices)"): #the most recent h2 tag must be the Cast h2.
                continue
                
            most_recent_h3 = get_most_recent_tag_of_type(ul, "h3")

            if not most_recent_h3 == None:
                most_recent_h3_contents = most_recent_h3.text_content().strip().lower()
                if "uncredited" in most_recent_h3_contents or "notes" in most_recent_h3_contents: #it's a pity but we don't really want the uncredited cast, or we get random brigadier/susan cameos in the new series, in places where they shouldn't really count. Removing 'notes' gets around an error that was occurring on The Snowmen's page where BBC iPlayer was suddenly considered a character!
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
                        if not "redlink" in link and not "stunt_double" in link.lower() and not link.lower() in FOREVER_BLACKLIST: 
                            if not tag.tail == None: 
                                if "as" in tag.tail: # the 'as' part is my attempt to get things like 'and introducing Matt Smith as the Doctor' to work, becuse it should ignore the Matt Smith (as its tail contains 'as') and instead pick up the link for 'Eleventh Doctor'
                                    continue
                            character_links.append(link.split("/")[0].split("#")[0])
                    if not tag.tail == None and (" - " in tag.tail or "—" in tag.tail or "–" in tag.tail):
                        break
                    
    return character_links

ROOT_URL = "https://mirror.tardis.wiki/wiki/"

episode_links = open("episodes.txt", mode="r", encoding="utf-8").read().replace("\r","").split("\n")

#shuffle(episode_links)

episode_charmaps = []

characters = []

def process_characters(cast, episode_id):
    print(cast)
    output = []
    for i in range(len(cast)):
        char = cast[i]
        if char == "Kate_Lethbridge-Stewart":
            char = "Kate_Stewart"
        if char == "Jo_Jones":
            char = "Jo_Grant"
        if char == "Brigadier_Lethbridge-Stewart":
            char = "Alistair_Gordon_Lethbridge-Stewart"
        if char == "K9_Mark_I" or char == "K9_Mark_II" or char == "K9_Mark_III" or char == "K9_Mark_IV": #it's already a bit inconsistent so I might as well make them all the same. He basically is the same character every time anyway.
            char = "K9"
        if char == "R":
            char = "R/T Soldier"
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

num_complete = 0
out_of_str = "/"+str(len(episode_links))

for episode in episode_links:
    cast = parse_cast_list(episode)
    episode_lower = episode.lower()
    if "the_day_of_the_doctor" in episode_lower:
        cast.extend(["The_Curator_(The_Day_of_the_Doctor)","War_Doctor","Ninth_Doctor","Tenth_Doctor","Eleventh_Doctor","Twelfth_Doctor"]) #after much debate I've decided not to include the classic doctors in DOTD - it's a good enough connection node as it is without pretending that the cameos really amount to those characters being present! I doubt it will actually harm many scores, and will lead to more satisfying connection paths than 'Third Doctor was in Day of the Doctor' when his appearance is so fleeting and solely using archive footage.
        cast.remove("The_Doctor")
        if "First_Doctor" in cast: # From John Guilor's voice credit as the first doctor. As discussed above I don't really think this should be included as an appearance of the first doctor because it's so fleeting and cameo-like, even if it's supposed to be a novel appearance.
            cast.remove("First_Doctor")
    elif "the_power_of_the_doctor" in episode_lower:
        cast.extend(["Guardians_of_the_Edge","Thirteenth_Doctor"])
        cast.remove("The_Doctor")
    elif "twice_upon_a_time" in episode_lower:
        cast.append("Thirteenth_Doctor")
    elif "the_giggle" in episode_lower:
        cast.append("Fifteenth_Doctor") 
    elif "mission_to_the_unknown" in episode_lower:
        cast.remove("The_Doctor")
    elif "the_reign_of_terror" in episode_lower:
        cast.remove("Susan")
        cast.append("Susan_Foreman")
    elif "survivors_of_the_flux" in episode_lower: #sorry brig fans... it's the tiniest of voice cameos and really shouldn't amount to a connection...
        cast.remove("Alistair_Gordon_Lethbridge-Stewart")
    episode_charmaps.append({"episode":episode, "chars":process_characters(list(dict.fromkeys(cast)), episode_links.index(episode))}) #the list(dict.fromkeys()) part is there to remove duplicates in the list (e.g. if a character is repeated twice in the same cast list for whatever reason (e.g. two daleks) we only need to record one instance)    
    print(str(num_complete)+out_of_str)
    num_complete += 1
    time.sleep(1)

json_dump = json.dumps({"episodes":episode_charmaps, "characters":characters})

open(OUTPUT_PATH, mode="w+", encoding="utf-8").write(json_dump)
open(WEB_OUTPUT_PATH, mode="w+", encoding="utf-8").write(json_dump)