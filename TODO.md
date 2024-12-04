# TODO 🚧

Your new site is all yours so it doesn't matter if you break it! Try editing the code–add a button element that moves when the user clicks it.

In `index.html`, add this code on the line after the comment with `ADD BUTTON HERE` in it (you can copy and paste the button element HTML):

```html
<button>
    Click me!
</button>

12/4/24 
the modal is popping out to the bottom and i like it...
keep it this way and the pop up page could be split in 2 
the right side being a table (retro vibe, scroll bar etc)
left side being a "popup" with the picture and source picture (like previous card popup a bit)
```

Look at the page to see the button. Click it!

Open `script.js` to see the script that makes the button move.

## Keep going! 🚀

Try adding more properties to the CSS `dipped` style for the button to see how the changes appear on click.


.html for the smiley svg
          <img
            src="https://stickers.be/wp-content/uploads/2017/01/smiley-sticker-2-blij-FC.svg"
            class="illustration"
            alt="Editor illustration"
            title="Click the image!"
          />

'  background-image: url('https://cdn.glitch.global/f2fb7d0f-1059-40bd-8a52-8cb00efc9022/backgroundforcardssite.webp?v=1732822606704');
  background-size: cover;           /* Makes sure the image covers the entire background */
  background-position: center;      /* Centers the image */
  background-repeat: no-repeat;     /* Prevents the image from repeating */
  background-attachment: fixed;     /* Makes the background image fixed when scrolling */'
  
  ^ use to add the background back to front page if needed :)
  
 
 
 <span class="fileopener" data-file="TODO.md" data-line="0"
              >TODO</span> for next steps!
              
              ^ this gives the todo underlined thing to link to the todo.md
              
              
              
              OLD CARD POPUP LAYOUT CSS STYLING 
              .popup-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  visibility: hidden;
  opacity: 0;
  transition: visibility 0s, opacity 0.3s;
}

.popup-container.show {
  visibility: visible;
  opacity: 1;
}

.popup {
  background: #ffffff;
  border-radius: 10px;
  min-height: 50vh; /* Ensures the popup is at least 50% of the viewport height */
  max-width: 90vw; /* Set maximum width to 75% of the viewport width */
  max-height: 75vh; /* Set maximum height to 75% of the viewport height */
  width: 60vw; /* Use 90% width for smaller screens if needed */
  height: 70vh;
  padding: 15px;
  position: relative;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  overflow: hidden; /* Hide any overflowing content */
  display: flex; /* Add flex layout to handle image and text sections */
  flex-direction: row; /* Place image and text side by side */
  align-items: center;
  justify-content: space-between;
}


.popup-image {
  background-color: ;
  width: 75%; /* Allow the image to take 50% of the popup width */
  max-width: 75vw; /* Maximum size to ensure responsiveness */
  height: 500px; /* Maintain aspect ratio */
  background-size: contain; /* Ensure the entire image is visible without cropping */
  background-position: center;
  background-repeat: no-repeat;
  border-radius: 10px; /* Optional for rounded corners */
}



.popup-close {
  position: absolute;
  top: 10px;
  right: 10px;
  cursor: pointer;
  font-size: 20px;
  color: #3038cf
}

.popup-content {
  color: #000000;
  background-color: #0ef1ed;
  width: 50%;
  padding: 5px; /* Add padding to give content more breathing room */
  height: ; /* Make sure content can expand naturally */
  overflow: auto; /* Allow scroll if content overflows */
  display: flex;
  flex-direction: column; /* Stack elements vertically */
  justify-content: space-between; /* Place tags at the bottom */
  height: 75%; /* Ensure it takes full height of the popup */

}

.popup-title {
  color: #000000;
  font-size: 48px;
}


.popup-tags {
  margin-top: auto; /* Push the element down if using flex-direction: column */
  margin-bottom: 20px; /* Set a fixed distance from the bottom */
  font-size: 12px;
}

.popup-link {
  color: #007bff;
  text-decoration: underline;
}

.popup-link:hover {
  text-decoration: none;
}

              end OLD CARD POP LAYOUT CSS STYLING
              
              
              
              
              OLD SMALL CARD LAYOUT
              
.card {
  background-color: #ffffff;
  background-size: cover; /* Or 'repeat' for a more subtle effect */
  border: 1px solid #f5e324;
  border-radius: 20px;
  overflow: hidden;
  box-shadow:;
  transition: transform 0.5s;
  cursor: pointer;
  min-height: 300px;
  border-top: 4px solid #000000;
  border-right: 4px solid #000000;
  border-bottom: 4px solid #000000;
  border-left: 4px solid #000000;
}



.card:hover {
  transform: translateY(-5px);
  box-shadow: ;
}

.card-image {
  width: 80%;
  height: 80%;
  background-size: contain;
  background-position: ;
  background-repeat: no-repeat;
  margin: 0 auto; /* Automatically set equal margins left and right */
}

.card-title {
  background: ;
  color: #000000;
  text-align: center;
  padding: 10px;
  font-weight: bold;
  font-size: 32px
}              

                              end OLD SMALL CARD LAYOUT
                              
                              
    **redo card page - all black (inspo picture in pinterest)
    -girl @ laptop dithered/stippled - added to left corner of card page
    -could be more of a motivational type thing (back to if i ruled the world, i'd consult
    these cards type beat).
              
              
              
              
              
              