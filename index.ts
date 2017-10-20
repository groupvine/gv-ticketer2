import * as sha256 from 'crypto-js/sha256.js';

const TicketLifetime_days = (365 * 5);
const TicketLifetime_ms   = TicketLifetime_days * 1000 * 60 * 60 * 24; 

const TicketPrefix        = '2-';  // indicates version 2

export function createHash(content:string[], numBytes?:number) {
    if (numBytes == null) {
        numBytes = 14;  // so 28 hex chars by default
    }

    let contentStr = content.join();

    let hash = sha256(contentStr).toString();
    
    let len  = numBytes * 2;  // convert bytes to chars
    if (hash.length > len) {
        hash = hash.substr(0, len);
    }

    return hash;
}

export class Ticketer {
    private _dateSeed : string;
    private _ticket   : string;
    private _secrets  : any[];  // [{value : '..', date : '..'}]

    constructor(secrets:any[]) {
        this._dateSeed = null;
        this._ticket   = null;
        this._secrets  = secrets;  
        if (this._secrets[0].value == null) {
            console.error("Ticketer constructor must be invoked with an array of at least one ticket secret");
        }
    }

    public createTicketedUrl(path:string, qArgs:any, dateSeed?:string) {
        let args     = JSON.parse(JSON.stringify(qArgs)); // create copy

        args['path'] = path;  // tempory, to compute ticket

        args['tkt']  = this.ticket(args, dateSeed); 
        args['date'] = this.getSeed();

        delete args['path'];  // remove

        let url   = path;
        let names = Object.keys(args);

        for (let i = 0; i < names.length; i++) {
            if (i === 0) { url += '?'; }
            else         { url += '&'; }

            url += names[i] + '=' + encodeURIComponent(args[names[i]]);
        }

        return url;
    }


    // body is either the string ticket body, or an object
    // converted to a string
    public ticket(body:any, dateSeed?:string) : string {
        body     = this.tktBody(body);  
        dateSeed = this.dateSeed(dateSeed);

        if (!body) {
            if (this._ticket) {
                return this._ticket;
            }
            throw "Ticketer:ticket -- need to provide ticket body to compute ticket"
        }
        
        // Compute hash (with default length)
        this._ticket = createHash([dateSeed, this._getKey(dateSeed), body]);

        // Add a version number to the start
        this._ticket = TicketPrefix + this._ticket;

        return this._ticket;
    }

    // body is either the string ticket body, or an object
    // converted to a string
    public validate(ticket:string, body:any, dateSeed:string) : string {
        body = this.tktBody(body);  

        let dt      = this._parseDateSeed(dateSeed);
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
            this._dateSeed = this._buildDateSeed(dateSeed);
        }

        return this._dateSeed;
    }

    public getSeed() : string {
        return this._dateSeed;
    }

    public tktBody(tktArgs:any) {
        if ( (typeof tktArgs === 'string') || (!isNaN(tktArgs)) || (tktArgs instanceof Date) ) {
            return tktArgs.toString();
        }

        let names = Object.keys(tktArgs);  // works for objects or arrays
        names.sort(); // put into fixed order

        let body   = '';
        let value;
        for (let i = 0; i < names.length; i++) {
            value = tktArgs[names[i]];
            if (value != null) {
                if (body) { body += '|'; }

                if ( (typeof value === 'string') || (!isNaN(value)) || (value instanceof Date) ) {
                    body += `${names[i]}=${value}`;
                } else if ( Array.isArray(value) ) {
                    body += `${names[i]}=[${this.tktBody(value)}]`;
                } else {
                    body += `${names[i]}={${this.tktBody(value)}}`;
                }
            }
        }
        return body;
    }

    // Return dateSeed string
    private _buildDateSeed(dt?:any) : string {
        if ((dt == null) || (typeof dt.getMonth !== 'function')) {
            dt = new Date();
        }

        this._dateSeed = dt.toISOString();

        // Remove seconds and fractional seconds (maintaining 'Z' tz indicator)
        this._dateSeed = this._dateSeed.replace(/\:\d+\.\d+Z/, 'Z');

        // Replace colons with periods (to avoid url-encoding of colons)
        this._dateSeed = this._dateSeed.replace(/\:/g, '.');

        // Add random seed to end
        this._dateSeed += '-' + Math.floor(Math.random() * 10000);

        return this._dateSeed;
    }

    // Return Date object
    private _parseDateSeed(dateSeed:string) : any {
        // Remove random digits from end
        let i       = dateSeed.lastIndexOf('-');
        let dateStr = dateSeed.substring(0, i);

        // Convert periods back to colons
        dateStr     = dateStr.replace(/\./g, ':');

        return new Date(dateStr);
    }

    private _getKey(dateSeed:any) : string {
        // pass in a date or a date seed string (and convert to date)

        // Lookup proper secret to use based on this date

        return this._secrets[0].value;  // Currently only one secrets
    }
}
