var dateUtil    = require("moment/moment");
var crypto      = require("crypto");

var TicketLifetimeDays = (365 * 5);

export class Ticketer {
    private _dateSeed : string;
    private _ticket   : string;
    private _secret   : string;

    constructor(secret:string) {
        this._dateSeed = null;
        this._ticket   = null;
        this._secret   = secret;  
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
        let md5  = crypto.createHash('md5');
        hash = md5.update(dateSeed, 'utf-8')
        hash = md5.update(this._getKey(dateSeed), 'utf-8')
        hash = md5.update(body, 'utf-8')

        this._ticket = hash.digest('hex');

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
        let dt      = dateUtil(dateStr, "DDMMMYY-HH:mm:ss");

        dt.add(TicketLifetimeDays, 'days');

        if (dt < dateUtil()) {
            return "Ticket has expired";
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
        if (dt.getMonth || dt.month) {
            if (! dateUtil.isMoment(dt) ) {
                dt = new dateUtil(dt);
            }
        } else {
            dt = new dateUtil();
        }

        this._dateSeed  = dt.format("DDMMMYY-HH:mm:ss");
        this._dateSeed += '-' + Math.floor(Math.random() * 10000);

        return this._dateSeed;
    }

    private _getKey(dateSeed) : string {
        // Fetch from datebase based on date 
        // Datebase can store (date, key) pairs.  Search will
        // return the key corresponding to the date that's the 
        // closest one before the date of the next key.
        return this._secret;
    }
}
