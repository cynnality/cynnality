Tuesday June 9th - 12:45am

---
<div class="postMain">
Over the past few weeks I've started working on so many things. I get so caught up in my ideas and the excitement of sharing them that I don't always take the time to _explain_... **Not** to try and stir up interest in the uninterested. I think _explanations_, in this sense (intentions, motivations, goals), are geared towards those who are already interested for their own reasons and are looking for **clarity** or **insight** of sorts.  
</div>

---

<div class="postIssue">
For the most part, <div class="purple-highlight">I just want to talk and share things about women's basketball.</div> In a more serious way - I have a lot of grievances with the WNBA as a business organization. And those grievances seem to live in the same place as my general feelings of anger and disappointment towards systems of power, deceitful uses of language, weaponized incompetence, etc... It's hard to talk about abstract concepts like oppressive systems of power in ways that seem like showing the simple _truth_, rather than a _personal view_. But I don't feel that same level of difficulty in terms of making an argument for the WNBA's poor business practices. And working towards making that argument (using "fact" instead of opinion) makes me feel like I'm _practicing_ in a way to make arguments for more "difficult" and abstract topics...
</div>

<div class="green-highlight">
So the main reasoning behind starting all this "data collection" is to offer a "solution" of sorts to some of the issues I have with the WNBA. A big issue I have is that there's no definitive source of truth for WNBA history (which is not the case for the NBA...) so why not create my own!!!
</div>

I started out manually typing all of the data in myself which made me avoid getting further into things since entering large amounts of JSON in is so BORING AND FINICKY. After about 6 months of manually handling the data, I thought I was losing motivation to work on this. I tried redirecting my focus to ideas for other things but I still felt an "itch" for the basketball stuff. Since I knew the manual data entry was making everything un-fun I decided to work on "tools" to help "automate" things a bit. I created forms that coincided with the "data shape" and fields being used for specific data files so filling out these forms would essentially fill out the data and give me the JSON object to copy and paste into the main data file. I was SO happy that I gave myself the time to experiment with creating "tools" like this because it was bringing the fun back! And it felt like the kind of step I would've talked myself out of trying a few months ago.

The copy and paste worked relatively well for me. But I wondered... If i could get it this close - what would I have to do in order to save the generated JSON directly to the main file from the tool page in my browser? After a bit more experimenting I created a local server that can write to my files!!!!! This was by far the coolest step in this basketball / learning to code process for me!!! 


---

Now that I got that done - I've been working to expand the way the data can "connect". Like creating cross reference "utilities" to help me keep track of discrepancies in the data and things that still need to be added to the main files. And using data from "main files" to "generate" / compile necessary data for "smaller" sets of data... like getting the NCAA and WNBA Championship teams from info within the main players data file!

I'm still doing some small tweaks to the tools/data structures/viewers before I hunker down and get another big chunk of info entered :) 

