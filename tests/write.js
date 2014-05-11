/**
 * Write test case
 *
 * @author Hermann Mayer <hermann.mayer92@gmail.com>
 */

var should = require('should');
var path = require('path');
var fs = require('fs-extra');
var id3 = require('id3js');

var File = require('../lib/file');
var Image = require('../lib/image');
var Meta = require('../lib/meta');
var Writer = require('../lib/writer');

var srcFile = path.join(__dirname, 'fixtures', 'tone.mp3');
var destFile = '/tmp/id3-writer-test-file.mp3';

var coverSrcFile = path.join(__dirname, 'fixtures', 'cover.png');
var coverDestFile = '/tmp/id3-writer-test-cover-file.png';

describe('Writer.constructor', function()
{
    var file = new File();
    var validFile = new File(srcFile);

    it('should work with a valid file and without options', function() {

        (function() {
            var writer = new Writer(validFile);
        }).should.not.throw();
    });

    it('should fail on an invalid file without options', function() {

        (function() {
            var writer = new Writer();
            writer.setFile(file);
        }).should.throw();
    });

    it('should fail on an invalid file-like object without options', function() {

        (function() {
            var writer = new Writer();
            writer.setFile({});
        }).should.throw();
    });

    it('should work on valid specified versions of options', function() {

        (function() {
            var writer = new Writer({
                version: 1
            });
            var writer = new Writer({
                version: 2
            });
            var writer = new Writer( {
                version: 'both'
            });
        }).should.not.throw();
    });

    it('should fail on invalid specified version of options', function() {

        (function() {
            var writer = new Writer({
                version: 3
            });
        }).should.throw();
    });

    it('should work on valid specified encoding.to of options', function() {

        (function() {
            var writer = new Writer({
                encoding: {
                    to: 'ISO-8859-15'
                }
            });
        }).should.not.throw();
    });

    it('should fail on invalid specified encoding.to of options', function() {

        (function() {
            var writer = new Writer({
                encoding: {
                    to: 'ISO-8859-1666'
                }
            });
        }).should.throw();
    });
});

describe('Writer.write', function()
{
    var file = new File();
    var cover = new File();

    beforeEach(function(done) {

        fs.copy(srcFile, destFile, function(err) {

            if (err) {
                return done(err);
            }

            file.setPath(destFile);

            fs.copy(coverSrcFile, coverDestFile, function(err) {
                cover.setPath(coverDestFile);
                done(err);
            });
        });
    });

    afterEach(function(done) {

        fs.unlink(destFile, function(err) {

            if (err) {
                return done(err);
            }

            fs.unlink(coverDestFile, done);
        });
    });

    it('should write id3 (v1 and v2) tags', function(done) {

        var writer = new Writer();
        var meta = new Meta({
            artist: 'Blur',
            song: 'Song 2',
            album: 'Blur'
        });

        writer.setFile(file).write(meta, function(err) {

            (!err).should.be.true;

            id3({
                file: destFile,
                type: id3.OPEN_LOCAL
            }, function(err, tags) {

                (!err).should.be.true;

                tags.artist.should.be.equal('Blur');
                tags.title.should.be.equal('Song 2');
                tags.album.should.be.equal('Blur');

                done();
            });
        });
    });

    it('should write id3 (v1 and v2) tags with images', function(done) {

        var image1 = new Image(cover);
        image1.setType('FRONT_COVER').setDescription('Album front cover art');

        var image2 = new Image(cover);
        image2.setType('BACK_COVER').setDescription('Album back cover art');

        var meta = new Meta({
            artist: 'Blur',
            song: 'Song 3',
            album: 'Blur'
        });
        meta.addImages([image1, image2]);

        var writer = new Writer();

        writer.setFile(file).write(meta, function(err) {

            (!err).should.be.true;

            id3({
                file: destFile,
                type: id3.OPEN_LOCAL
            }, function(err, tags) {

                (!err).should.be.true;

                tags.artist.should.be.equal('Blur');
                tags.title.should.be.equal('Song 3');
                tags.album.should.be.equal('Blur');

                tags.v2.image.type.should.be.equal('cover-back');
                tags.v2.image.description.should.be.equal('Album back cover art');

                done();
            });
        });
    });
});
