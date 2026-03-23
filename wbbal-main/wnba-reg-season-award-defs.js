const REG_SEASON_AWARD_DEFS = {

  peak_performers: {

    description: "peak performers have been recognized every WNBA season since 1997. the number and naming of the categoies has changed over time but peak performer titles are always based on players regular season stats.",

    decidedBy: "STATS",

    awardIds: [
      "topScorer",
      "peakPerformerScoring",
      "peakPerformerRebounding",
      "peakPerformerDishAndAssist",
      "shootingChampionsEast",
      "shootingChampionsWest",
      "shootingChampionsFieldGoalPercentage",
      "shootingChampionsFreeThrowPercentage"
    ],

    seasons: [

      {
        start: 1997,
        ids: [
            "shootingChampionsEast",
            "shootingChampionsWest"
        ],
        end: 1997,
        text: `the stars of this season were called "shooting champions" and there was one player from each conference chosen based on their shooting stats for that regular season`
      },

      {
        start: 1998,
        ids: [
            "shootingChampionsFieldGoalPercentage",
            "shootingChampionsFreeThrowPercentage"
        ],
        end: 2001,
        text: `this season the top 2 stars in field goal percentage and free throw percentage were awarded the "shooting champions" award`
      },

      {
        start: 2002,
        ids: [
            "peakPerformerScoring",
            "peakPerformerRebounding",
        ],
        end: 2004,
        text: `the regular season top scorer and rebounder were awarded the "peak performer" award`
      },

      {
        start: 2005,
        ids: [
            "peakPerformerScoring",
            "peakPerformerRebounding",
            "peakPerformerDishAndAssist"
        ],
        end: null,
        text: `this was the first season with 3 stars in the performance stat category and is the permanent structure of the peak performer award. the titles are top scorer, top rebounder, and top distribter (assists)`
      }

    ]

  },
 
  regular_season_mvps: {

    description: "the most valuable players of the regular season, chosen by a panel of sportswriters and broadcasters using a ranked choice voting system",

    decidedBy: "VOTE",

    awards: {

        MVuP: {

        seasons: [
            {
            start: 1997,
            end: null,
            text: `The overall regular season MVP award has been given out every WNBA season. Voters rank their top 5 picks and player with the most points wins the title`
            }
        ]

        },

        defensivePlayerOfTheYear: {

        seasons: [
            {
            start: 1997,
            end: null,
            text: `Defensive player of the year has also been given out every WNBA season. Voters rank their top 3 picks and player with the most points wins the title`
            }
        ]

        },

        rookieOfTheYear: {

        seasons: [
            {
            start: 1998,
            end: null,
            text: `Rookie of the year is awarded to the top rookie of the season. Voters rank their top three picks and player with the most points wins the title`
            }
        ]

        },

        newcomerOfTheYear: {

        seasons: [
            {
            start: 1998,
            end: 1999,
            text: ` 
                    When the WNBA started there was already another U.S. based professional women's basketball league called the ABL. When the ABL dissolved in 1998,
                    the WNBA absorbed a lot of the former ABL players and the newcomer of the year award was created to recognize players who were technically rookies 
                    to the league but had professional play experience outside of the league.
                    `
            }
        ]

        },

        sixthPlayerOfTheYear: {

        seasons: [
            {
            start: 2007,
            end: null,
            text: `Off the bench / sixth player of the year is given to a player with the biggest impact on the court without being a regular starter for their team.
                    It seems like voters all make one selection and player with most votes wins the title`
            }
                    ]

        }

    }
    },

    topDraftPick: {

        description: "The player chosen first at the WNBA draft",

        decidedBy: "DRAFT",

        seasons: [
            {
            start: 1997,
            ids: ["topDraftPick"],
            end: null,
            text: `It's not an official award but there's a lot that comes along with being chosen first at the draft`
            }
        ]
    },

    sportsmanshipAward: {

        description: "every WNBA season each team nominates one player and voters rank their top 2 picks out of those nominees. the player with the most points wins the title",

        decidedBy: "NOMINATION_AND_VOTE",

        awardIds: [
            "sportsmanshipAward"
        ],

        seasons: [
            {
                start: 1997,
                end: 1999,
                text: "for the first 3 seasons of the WNBA the sportsmanship award was simply named the sportsmanship award and was given to one player each season"
            },
            {
                start: 2000,
                end: null,
                text: 'Kim Perrot played in the WNBAs first 2 seasons as #10 with the Houston Comets in 1997 and 1998.After being diagnosed with cancer in February 1999 she was unable to continue playing and passed away later that same year in August. September of 1999 the Houston Comets went on to win the WNBA Playoff Championships for their 3rd consecutive season and finals MVP Cynthia Cooper said it was #3 or #10 dedicating it her late teammate and friend Kim Perrot. A posthumous 3rd championship ring was award to Kim Perrot and her #10 jersey was retired. And the name of the leagues sportsmanship award is now named in Kim Perrots honor'
            }
        ]
    },

    DawnStaleyCommunityLeadershipAward: {

        description: "Since 2008 each wnba team nominates one player and a dedicated committee votes for the winner. Winning this award lets the player choose a charity that the league donates $10,000 to in their name",

        decidedBy: "NOMINATION_AND_VOTE",

        awardIds: [
            "DawnStaleyCommunityLeadershipAward"
        ],

        seasons: [
            {
                start: 2008,
                end: null,
                text: "The Dawn Staley Community Leadership Award was established in 2008 to honor a WNBA player who demonstrates leadership and commitment to community service."
            }
        ]
    },
    mostImprovedPlayer: {

        description: "Since 2002 players who made significant improvements to their game have been recognize with the most improved award. voters rank their top 3 picks and player with the most points wins the title",

        decidedBy: "VOTE",

        awardIds: [
            "mostImprovedPlayer"
        ],

        seasons: [
            {
                start: 2002,
                end: null,
                text: "awarded to a player with recognizably better game"
            }
        ]
    }
}