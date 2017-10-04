let createHash          = require('crypto-browserify').createHash;

var TicketLifetime_days = (365 * 5);
var TicketLifetime_ms   = TicketLifetime_days * 1000 * 60 * 60 * 24; 

var TicketPrefix        = '2:';  // indicates version 2

export class Ticketer {
    private _dateSeed : string;
    private _ticket   : string;
    private _secrets  : any[];  // [{value : '..', date : '..'}]

    constructor(secrets:any[]) {
        this._dateSeed = null;
        this._ticket   = null;
        this._secrets  = secrets;  
        if (this._secrets[0].value == null) {
            console.error("Ticketer constructor: must specify at least one ticket secret");
        }
    }

    // body is either the string ticket body, or an object
    // converted to a string
    public ticket(body:any, dateSeed?:string) : string {
        if (typeof body !== 'string') {
            body = this.tktBody(body);  
        }

        if (!body) {
            if (this._ticket) {
                return this._ticket;
            }
            throw "Ticketer:ticket -- need to provide ticket body to compute ticket"
        }
        
        if (!dateSeed) {
            dateSeed = this.dateSeed();
        }

        let hash;
        let alg  = createHash('sha256');
        hash = alg.update(dateSeed, 'utf-8')
        hash = alg.update(this._getKey(dateSeed), 'utf-8')
        hash = alg.update(body, 'utf-8')

        this._ticket = hash.digest('hex');

        // Truncate to 14 bytes (to make it an SHA-256/112 hash with 112 bits)
        this._ticket = this._ticket.substr(0, 14 * 2);

        // Add a version number to the start
        this._ticket = TicketPrefix + this._ticket;

        return this._ticket;
    }

    // body is either the string ticket body, or an object
    // converted to a string
    public validate(ticket:string, body:any, dateSeed:string) : string {
        if (typeof body !== 'string') {
            body = this.tktBody(body);  
        }

        let i       = dateSeed.lastIndexOf('-');
        let dateStr = dateSeed.substring(0, i);

        let dt      = new Date(dateStr);
        let now     = new Date();

        if (dt.getTime() + TicketLifetime_ms < now.getTime()) {
            return "Ticket has expired";
        }

        if (ticket.substr(0, 2) != TicketPrefix) {
            return "Invalid ticket version, should start with '" + TicketPrefix + "' for gv-ticket2"
        }

        if (ticket !== this.ticket(body, dateSeed)) {
            return "Invalid ticket";
        }

        return '';  // valid
    }

    public dateSeed(dateSeed?:any) : string {
        if (typeof dateSeed === 'string') {
            this._dateSeed = dateSeed;
        } else {
            this._dateSeed = this._computeDateSeed(dateSeed);
        }

        return this._dateSeed;
    }

    public getSeed() : string {
        return this._dateSeed;
    }

    public tktBody(tktArgs:any) {
        let names = Object.keys(tktArgs);
        names.sort(); // put into fixed order

        let body   = '';
        for (let i = 0; i < names.length; i++) {
            if (tktArgs[names[i]] != null) {
                if (body) { body += '|'; }
                body += `${names[i]}=${tktArgs[names[i]]}`;
            }
        }
        return body;
    }

    private _computeDateSeed(dt?:any) : string {
        if ((dt == null) || (typeof dt.getMonth === 'function')) {
            dt = new Date();
        }

        this._dateSeed = dt.toISOString();

        // Remove seconds and fractional seconds (maintaining 'Z' tz indicator)
        this._dateSeed = this._dateSeed.replace(/\:\d+\.\d+Z/, 'Z');

        // Add random seed to end
        this._dateSeed += '-' + Math.floor(Math.random() * 10000);

        return this._dateSeed;
    }

    private _getKey(dateSeed:any) : string {
        // pass in a date or a date seed string (and convert to date)

        // Lookup proper secret to use based on this date

        return this._secrets[0].value;  // Currently only one secrets
    }
}
