import requests
from lxml import html
from io import BytesIO
import time

def parse_season_page(link):
    response = requests.get(link)
    with BytesIO(response.content) as f:
        page = f.read()
        tree = html.fromstring(page)
        table_title_headers = filter(lambda th : "Title" in str(html.etree.tostring(th), encoding="utf-8"), tree.findall(".//th"))
        for title_th in table_title_headers:
            tbody = title_th.getparent().getparent()
            for i in range(1, len(tbody)):
                if len(list(tbody)[i]) > 1:
                    first_anchortag = list(list(tbody)[i])[1].find(".//a")
                    if not first_anchortag == None:
                        episode_link = first_anchortag.attrib.get("href")
                        episode_links_output.append(episode_link)

ROOT_URL = "https://mirror.tardis.wiki/wiki/"

season_links = []

episode_links_output = ["Doctor_Who_(TV_story)"]

for i in range(1,26+1):
    season_links.append(ROOT_URL + "Season_"+str(i)+"_(Doctor_Who_1963)")

for i in range(1,13+1):
    season_links.append(ROOT_URL + "Series_"+str(i)+"_(Doctor_Who_2005)")

for i in range(1,2+1):
    season_links.append(ROOT_URL + "Season_"+str(i)+"_(Doctor_Who_2023)")

for link in season_links:
    print("Gathering from "+link)
    parse_season_page(link)
    time.sleep(1)

output = open("episodes.txt", mode="w+", encoding="utf-8")

for episode_link in episode_links_output:
    output.write(episode_link.split("/wiki/")[-1]+"\n")