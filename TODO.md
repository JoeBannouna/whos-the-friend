DONE: Return the full list of votes, always, on the backend.
DONE: Attach colors to players on the backend from a unique color-pool
DONE: Make it so that players can join mid game.
DONE: Remove the 'Leave' and 'Next' buttons from the screen.
DONE: Only allow the game master to press next.
PARTIALLY DONE: Create a backend route that checks if an ID stored on the frontend is valid and show on the frontend that a user can relog with his/her previous playerId.
* Create a fail-safe when there are more players in a game than existing colors in the pfp color pool
* Remove all votes from a kicked player on playerRemove function.
* Reconfigure the frontend to enable the next button via an inequality rather than an equality of condition: "votes >= online_players"
* Stop making animations depend on gameStateEvent of a player leaving (or on gameStateEvent in general)
* Thoroughly test password-protected rooms and encrypt the room-data based on that password
* Re-imagine the way playerId are stored and sent over websockets for player-rejoins to a more robust approach.
