/**
 * This tests that the Controls and reference track render correctly, even when
 * an externally-set range uses a different chromosome naming system (e.g. '17'
 * vs 'chr17'). See https://github.com/hammerlab/pileup.js/issues/146
 * @flow
 */

'use strict';

var expect = require('chai').expect;

var pileup = require('../src/pileup'),
    TwoBit = require('../src/TwoBit'),
    TwoBitDataSource = require('../src/TwoBitDataSource'),
    MappedRemoteFile = require('./MappedRemoteFile'),
    {waitFor} = require('./async');

describe('GenomeTrack', function() {
  var testDiv = document.getElementById('testdiv');

  beforeEach(() => {
    // A fixed width container results in predictable x-positions for mismatches.
    testDiv.style.width = '800px';
  });

  afterEach(() => {
    // avoid pollution between tests.
    testDiv.innerHTML = '';
    testDiv.style.width = '';
  });

  var twoBitFile = new MappedRemoteFile('/test/data/hg19.chr17.7500000-7501000.2bit.mapped',
                            [[0, 16383], [691179834, 691183928], [694008946, 694009197]]),
      referenceSource = TwoBitDataSource.createFromTwoBitFile(new TwoBit(twoBitFile));

  var hasReference = () => {
      // The reference initially shows "unknown" base pairs, so we have to
      // check for a specific known one to ensure that it's really loaded.
      return testDiv.querySelectorAll('.reference text.C').length > 0;
    };

  it('should tolerate non-chr ranges', function() {
    var p = pileup.create(testDiv, {
      range: {contig: '17', start: 7500730, stop: 7500790},
      tracks: [
        {
          data: referenceSource,
          viz: pileup.viz.genome(),
          isReference: true
        }
      ]
    });

    return waitFor(hasReference, 2000).then(() => {
      // The contig selector should list have "chr" prefixes & an active selection.
      var options = testDiv.querySelectorAll('option');
      expect(options).to.have.length.above(20);
      expect(options[0].textContent).to.equal('chr1');
      var opt17 = (options[17]: any);
      expect(opt17.textContent).to.equal('chr17');
      expect(opt17.selected).to.be.true;
      expect(p.getRange()).to.deep.equal({
        contig: 'chr17',
        start: 7500730,
        stop: 7500790
      });
    });
  });
});