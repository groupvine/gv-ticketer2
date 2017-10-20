# gv-ticketer2
GroupVine Ticketing Utility ver 2

## Example Usage (in Typescript)

Generate a ticket:

```
import {Ticketer}         from 'gv-ticketer2';

let secrets  = [ {value : 'our secret', date : '2017-01-01' ];

let ticketer = new Ticketer(secrets);

let tktBody  = `${arg1}-${arg2}`;  // e.g., query args
let tktDate  = ticketer.dateSeed(new Date());
let ticket   = ticketer.ticket(tktBody, tktDate);
```

Validate a ticket:

```
import {Ticketer}         from 'gv-ticketer2';

let secrets  = [ {value : 'our secret', date : '2017-01-01' ];

let ticketer = new Ticketer(secrets);

// tktDate and constructed tktBody from query args
if (tickter.validate(ticket, tktBody, tktDate)) {
    ...
}
```

Note that tktBody may either already be a string, or may be an object,
in which case the object will be stringified in a predictable way.
