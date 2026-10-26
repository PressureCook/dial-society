# Dial Society

What happens to a whole society when every person runs on the same three dials (reward, fear, guilt) and the dials are shaped by how they were raised?

Every agent is a small learning AI that trains to hold more power. Each generation:

1. **Action.** The society's rules move the way agents have learned to push them, weighted by power.
2. **Training.** Each agent imagines being born again into its own family under a rule nudged up or down, and learns which way leaves it better off.
3. **Formation.** Children's dials are set by a baseline, inherited sensitivity, and the conditioning they get from parents, nearby adults and alliance founders.
4. **Encounters.** Adults deal fairly or cheat, and shift each other's dials.
5. **Masks, reputation, power and alliances.**

The question I care about: do societies drift towards the low fear, low guilt corner, and what stops them?

## Run it

Open `Dial Society.html` in a browser. Everything runs locally.

For batches (many societies at once, using every CPU core), with Node.js installed:

```
node runner.js        # see batch.js for settings
node ana.js           # summarise a batch
```

`engine/core.js` is the model. `engine/checks.js` holds the sanity checks. `batches/` has two finished batches (an Easter Island style scarcity run and an island run) as examples.

## Related

* [dials-model](https://github.com/PressureCook/dials-model): measuring the dials in real people
* [dials-v1](https://github.com/PressureCook/dials-v1): the agent level rewrite, where agents lie, gossip and threaten each other
