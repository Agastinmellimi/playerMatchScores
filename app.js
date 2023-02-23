const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());

let db = null;
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const intializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
intializeDbAndServer();

// GET All Players List API
app.get("/players/", async (request, response) => {
  const getAllPlayersQuery = `
    SELECT player_id AS playerId, player_name AS playerName
    FROM player_details;`;
  const playersArray = await db.all(getAllPlayersQuery);
  response.send(playersArray);
});

// GET Specific player_id API
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT player_id AS playerId, player_name AS playerName
    FROM player_details
    WHERE player_id = ${playerId};`;
  const player = await db.get(getPlayerQuery);
  response.send(player);
});

// UPDATE(PUT) player API
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayerQuery = `UPDATE player_details
    SET player_name = '${playerName}'
    WHERE player_id = ${playerId};`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

// GET match API
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `SELECT * FROM match_details WHERE match_id = ${matchId};`;
  const matchArray = await db.get(getMatchQuery);
  response.send({
    matchId: matchArray["match_id"],
    match: matchArray["match"],
    year: matchArray["year"],
  });
});

// GET all matches list of specific player API
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesListQuery = `
      SELECT match_details.match_id AS matchId, 
             match_details.match AS match,
             match_details.year AS year
      FROM player_match_score 
      INNER JOIN match_details ON player_match_score.match_id = match_details.match_id
      WHERE player_match_score.player_id = ${playerId};`;
  const matchesListArray = await db.all(getMatchesListQuery);
  response.send(matchesListArray);
});

// GET All Players List of specific match API
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersListQuery = `
     SELECT player_details.player_id AS playerId,
            player_details.player_name AS playerName
     FROM player_match_score 
     INNER JOIN player_details ON player_match_score.player_id = player_details.player_id
     WHERE player_match_score.match_id = ${matchId};`;
  const playerListArray = await db.all(getPlayersListQuery);
  response.send(playerListArray);
});

// GET the total score, four, sixes of specific player API
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getTotalPlayerDetailsQuery = `
      SELECT player_details.player_id AS playerId,
             player_details.player_name AS playerName,
             SUM(score) AS totalScore,
             SUM(fours) AS totalFours,
             SUM(sixes) AS totalSixes
      FROM player_match_score 
      INNER JOIN player_details ON player_match_score.player_id = player_details.player_id
      WHERE player_match_score.player_id = ${playerId};`;
  const playerScoresArray = await db.get(getTotalPlayerDetailsQuery);
  response.send(playerScoresArray);
});

module.exports = app;
