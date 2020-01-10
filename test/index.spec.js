import { expect } from "chai"
import Kpathsea from "../src/index"

describe("Kpathsea class", () => {
  describe("constructor", () => {
    it("should return a Kpathsea object", () => {
      const kpathsea = new Kpathsea();
      expect(kpathsea).to.be.instanceOf(Kpathsea);
    })

    it("should throw an error when the version is missing", () => {
      expect(() => new Kpathsea( { db: {} })).to.throw('missing version number in database');
    })
  })  

  describe("toJSON", () => {
    it("should be idempotent", () => {
      const kpathsea = new Kpathsea();
      const kpathsea2 = new Kpathsea({ db: JSON.parse(kpathsea.toJSON()) } );
      expect(kpathsea2).to.be.instanceOf(Kpathsea);      
    })
  })  
           
           
  describe("findMatch", () => {
    it("should find a path that I have added", async () => {
      const kpathsea = new Kpathsea( { root: '' } );
      kpathsea.add( "/this/is/a/path" );
      kpathsea.add( "/this/is/a/PATH" );
      kpathsea.add( "/another/path/goes/here" );
      kpathsea.add( "/THIS/is/a/PATH" );
      expect(await kpathsea.findMatches("here")).to.eql(["/another/path/goes/here"]);
    })
  })

  describe("findMatches", () => {
    it("should find multiple paths that I have added", async () => {
      const kpathsea = new Kpathsea( { root: '' } );
      kpathsea.add( "/this/is/a/path" );
      kpathsea.add( "/this/is/a/PATH" );
      kpathsea.add( "/another/path/goes/here" );
      kpathsea.add( "/THIS/is/a/PATH" );
      expect(await kpathsea.findMatches("path")).to.have.length(3);
    })

    it("should find case-insensitive paths that I have added", async () => {
      const kpathsea = new Kpathsea( { root: '' } );
      kpathsea.add( "/this/is/a/path" );
      kpathsea.add( "/this/is/a/PATH" );
      kpathsea.add( "/another/path/goes/here" );
      kpathsea.add( "/THIS/is/a/PATH" );
      expect(await kpathsea.findMatches("PATH")).to.eql(await kpathsea.findMatches("path"));
    })

    it("return nothing when there are no matching paths", async () => {
      const kpathsea = new Kpathsea( { root: '' } );
      kpathsea.add( "/this/is/a/path" );
      kpathsea.add( "/this/is/a/PATH" );
      kpathsea.add( "/another/path/goes/here" );
      kpathsea.add( "/THIS/is/a/PATH" );
      expect(await kpathsea.findMatches("nothing")).to.eql([]);
    })    

    it("correctly handle the root option", async () => {
      let root = '/a/different/root';
      const kpathsea = new Kpathsea( { root } );
      kpathsea.add( "/this/is/a/path" );
      kpathsea.add( "/this/is/a/PATH" );
      kpathsea.add( "/another/path/goes/here" );
      kpathsea.add( "/THIS/is/a/PATH" );
      expect(await kpathsea.findMatches("here")).to.eql([root + "/another/path/goes/here" ]);
    })        
  })

  describe("findMatch", () => {
    it("finds the shortest path", async () => {
      let root = '/texmf';
      const kpathsea = new Kpathsea();
      kpathsea.add( "/this/is/a/short/path" );
      kpathsea.add( "/this/is/a/really/long/PATH" );
      kpathsea.add( "/another/path/goes/here" );
      kpathsea.add( "/THIS/is/an/even/longer/PATH" );
      expect(await kpathsea.findMatch("path")).to.eql("/texmf/this/is/a/short/path");
    })        
  })
  
})
