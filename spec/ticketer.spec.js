describe("Ticketer", () => {
    var Ticketer    = require('../index').Ticketer;
    var createHash  = require('../index').createHash;

    beforeEach(() => {
        secrets  = [ {value : 'our secret', date : '2017-01-01'} ];
        ticketer = new Ticketer(secrets);
    });

    it("should be able to generate a dateSeed for a given date", () => {
        var dateSeed = ticketer.dateSeed(new Date(2017, 6, 1));

        // console.log(dateSeed);
        expect(dateSeed).toContain('2017-07-01T');
        expect(dateSeed).toContain('Z-');

        expect(ticketer.getSeed()).toContain('2017-07-01T');
    });

    it("should be able to generate a dateSeed for a new date", () => {
        var dateSeed = ticketer.dateSeed();

        // console.log(dateSeed);
        expect(dateSeed).toContain('Z-');
    });

    it("should be able to generate a tkt body from a string", () => {
        var tktBody  = ticketer.tktBody("hello/there/you/people");
        expect(tktBody).toEqual('hello/there/you/people');
    });

    it("should be able to generate a tkt body from a simple object", () => {
        var obj = { 'age' : 17, type : 'rock', date : new Date(2017, 0, 1) };

        var tktBody  = ticketer.tktBody(obj);

        // console.log(tktBody);
        expect(tktBody).toEqual('age=17|date=Sun Jan 01 2017 00:00:00 GMT-0800 (PST)|type=rock');
    });

    it("should be able to generate a tkt body from a complex object", () => {
        var obj = { 
            name    : 'Dave', 
            profile : { 
                age      : 29, 
                photos   : [ 'photo1', 'photo2' ], 
                children : { 'tom' : 13, 'sue' : 12} 
            } 
        };

        var tktBody  = ticketer.tktBody(obj);

        // console.log(tktBody);
        expect(tktBody).toEqual('name=Dave|profile={age=29|children={sue=12|tom=13}|photos=[0=photo1|1=photo2]}');
    });

    it("should be able to generate a ticket", () => {
        var obj = { 'age' : 17, type : 'rock' };

        var dateSeed = '2017-07-01T07.00Z-4321';
        var ticket   = ticketer.ticket(obj, dateSeed);

        // console.log(ticket);
        expect(ticket).toEqual('2-6eb454411616d3c5c769e457da54');
    });

    it("should be able to generate a ticket without dateSeed", () => {
        var obj = { 'age' : 17, type : 'rock' };

        var ticket   = ticketer.ticket(obj);

        // console.log(ticket);
        expect(ticket).toContain('2-');
    });

    it("should generate a diff ticket for a diff date seed", () => {
        var obj = { 'age' : 17, type : 'rock' };

        var dateSeed = '2017-07-01T07.00Z-1234';
        var ticket   = ticketer.ticket(obj, dateSeed);

        // console.log(ticket);
        expect(ticket).toEqual('2-f256371d3c49fd1e0f847d1df451');
    });

    it("should generate a diff ticket for a diff body", () => {
        var obj = { 'age' : 18, type : 'rock' };

        var dateSeed = '2017-07-01T07.00Z-1234';
        var ticket   = ticketer.ticket(obj, dateSeed);

        // console.log(ticket);
        expect(ticket).toEqual('2-bb6d6ca1017ba0f94452f4a973c2');
    });

    it("should be able to validate a ticket", () => {
        var obj = { 'age' : 18, type : 'rock' };

        var dateSeed = '2017-07-01T07.00Z-1234';
        var ticket   = ticketer.ticket(obj, dateSeed);

        // console.log(ticket);
        expect(ticketer.validate(ticket, obj, dateSeed)).toEqual('');
    });

    it("should be able to create a ticketed URL", () => {
        var path     = '/api/secure';
        var args     = { 'age' : 18, type : 'rock' };
        var dateSeed = '2017-07-01T07.00Z-1234';

        var url      = ticketer.createTicketedUrl(path, args, dateSeed); 

        // console.log(url);
        expect(url).toEqual('/api/secure?age=18&type=rock&tkt=2-69235739f466d956ae0030e71127&date=2017-07-01T07.00Z-1234');
    });

    it("should be able to create a ticketed URL without dateSeed", () => {
        var path     = '/api/secure';
        var args     = { 'age' : 18, type : 'rock' };

        var url      = ticketer.createTicketedUrl(path, args); 

        // console.log(url);
        expect(url).toContain('/api/secure?age=18&type=rock&tkt=2-');
        expect(url).toContain('&date=');
    });

    it("should be able to create a hash separately", () => {
        let hash = createHash(['please create a hash on this', 'and this']);

        // console.log(hash);
        expect(hash).toEqual('5c5f9e9c519f67ceece5a9e7914c');
    });

    it("should be able to create a hash separately with given length", () => {
        let hash = createHash(['please create a hash on this', 'and this'], 8);

        // console.log(hash);
        expect(hash).toEqual('5c5f9e9c519f67ce');
    });
});
