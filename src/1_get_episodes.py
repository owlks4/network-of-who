import requests
from lxml import html
from io import BytesIO
import time
import os

def is_title(th_str):
    return "Title" in th_str or "Episode title" in th_str #picks up some edge cases like the way Flux is listed in the table

def parse_season_page(link):
    response = requests.get(link)
    with BytesIO(response.content) as f:
        page = f.read()
        tree = html.fromstring(page)
        table_title_headers = filter(lambda th : is_title(str(html.etree.tostring(th), encoding="utf-8")), tree.findall(".//th"))
        for title_th in table_title_headers:
            tbody = title_th.getparent().getparent()
            index_of_title_th = title_th.getparent().index(title_th)
            for i in range(1, len(tbody)):
                if len(list(tbody)[i]) > 1:
                    anchortags = list(list(tbody)[i])[index_of_title_th].findall(".//a")
                    for tag in anchortags:
                        episode_link = tag.attrib.get("href")
                        episode_link_lower = episode_link.lower()
                        if "(tv_story)" in episode_link_lower or "(webcast)" in episode_link_lower or "(home_video)" in episode_link_lower: #picks up some weird edge cases like the way Ascension of the Cybermen/The Timeless Children is listed.
                            if not episode_link in episode_links_output and not ("the_five(ish)_doctors_reboot" in episode_link_lower or "an_adventure_in_space_and_time" in episode_link_lower):
                                episode_links_output.append(episode_link)

OUTPUT_PATH = "episodes.txt"

if os.path.isfile(OUTPUT_PATH):
    print(OUTPUT_PATH + " already exists. If you really do want to regenerate it, please delete it first, then run this script again. Aborting for now.")
    exit()

ROOT_URL = "https://mirror.tardis.wiki/wiki/"

season_links = [ROOT_URL + "50th_Anniversary_Specials", ROOT_URL + "60th_Anniversary_Specials"]

episode_links_output = ["The_Five_Doctors_(TV_story)", "Doctor_Who_(TV_story)", "The_Halloween_Apocalypse_(TV_story)", "War_of_the_Sontarans_(TV_story)", "Once,_Upon_Time_(TV_story)", # the TV movie won't be picked up in any season, and the Doctor Who: Flux episodes have an edge case table design, so they're listed here manually
                        "Village_of_the_Angels_(TV_story)", "Survivors_of_the_Flux_(TV_story)", "The_Vanquishers_(TV_story)"]

for i in range(1,26+1):
    season_links.append(ROOT_URL + "Season_"+str(i)+"_(Doctor_Who_1963)")

for i in range(1,15+1):
    season_links.append(ROOT_URL + "Series_"+str(i)+"_(Doctor_Who_2005)")

for i in range(1,2+1):
    season_links.append(ROOT_URL + "Season_"+str(i)+"_(Doctor_Who_2023)")

for link in season_links:
    print("Gathering from "+link)
    parse_season_page(link)
    time.sleep(1)

episode_links_output = list(dict.fromkeys(map(lambda x : x.split("/wiki/")[-1], episode_links_output))) #reduces it to unique entries

output = open(OUTPUT_PATH, mode="w+", encoding="utf-8")

for episode_link in episode_links_output:
    output.write(episode_link+"\n")