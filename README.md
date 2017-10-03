# gv-ticketer
GroupVine Ticketing Utility ver 2

## Example Usage (in Typescript)

Generate a ticket:

```
import {Ticketer}         from 'ticketer';

let ticketer = new Ticketer(secret);

let tktBody  = `${arg1}-${arg2}`;  // e.g., query args
let tktDate  = ticketer.dateSeed(new Date());
let ticket   = ticketer.ticket(tktBody, tktDate);
```

Validate a ticket:

```
import {Ticketer}         from 'ticketer';

let ticketer = new Ticketer(secret);

// tktDate and constructed tktBody from query args
if (tickter.validate(ticket, tktBody, tktDate)) {
    ...
}
```
