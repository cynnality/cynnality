const olympicGames = [
  { year: 1976, city: "Montreal", country: "Canada" },
  { year: 1980, city: "Moscow", country: "USSR" },
  { year: 1984, city: "Los Angeles", country: "USA" },
  { year: 1988, city: "Seoul", country: "South Korea" },
  { year: 1992, city: "Barcelona", country: "Spain" },
  { year: 1996, city: "Atlanta", country: "USA" },
  { year: 2000, city: "Sydney", country: "Australia" },
  { year: 2004, city: "Athens", country: "Greece" },
  { year: 2008, city: "Beijing", country: "China" },
  { year: 2012, city: "London", country: "UK" },
  { year: 2016, city: "Rio de Janeiro", country: "Brazil" },
  { year: 2020, city: "Tokyo", country: "Japan" },
  { year: 2024, city: "Paris", country: "France" }
];

click to make the mini chips appear as main chip (prev. in loadMiniChip()

  // CLICK → swap main chip + text
  chip.addEventListener("click", (e) => {
    e.stopPropagation();
    loadMainOlympicsChip(game);
    updateOlympicsText(game);
  });)


    ============
wbbal-main.js          ← app shell / navigation / folders
olympics-folder.js    ← Olympics-specific logic only
pro-league-data.js    ← WNBA data + rendering
    =========

                            <rect id="about-olympics-linkto-medals" width="100" height="100" x="537.24786" y="560"
                            class="links-to-others  linksto-others">
                            <desc id="desc57">a 'button' that should open medals (chips) within this category - which is
                                olympics (to
                                be added later)

                            </desc>
                        </rect>
                        <rect id="about-olympics-linkto-helper" width="100" height="100" x="674.56287" y="560"
                            class="links-to-others  linksto-others">
                            <desc id="desc58">a &quot;button&quot; to link to the helper view
                                to ask a specific question:
                                &quot;who makes these decisions?&quot; </desc>
                        </rect>