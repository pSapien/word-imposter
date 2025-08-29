# Skribl App (v2)

Changes vs v1:
- **Reconnect by username**: if you reconnect with the same name to the same room, you take over your old session (score, guessed state, admin).
- **Bucket tool**: click to flood-fill an area with the selected color.
- **Canvas sync on join/rejoin**: server replays canvas ops so late joiners and reconnecting users see the current drawing.
- **New turn fix**: canvas clears at the start of each drawing round to avoid stale drawings.
- **Drawer rejoin**: if the drawer disconnects, they can rejoin with the same name and continue. (If they don't return quickly, the round ends when time runs out.)

## Run
```bash
npm install
npm start
# http://localhost:8080
```
