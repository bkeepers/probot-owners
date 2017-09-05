const expect = require('expect')

const Changes = require('../lib/changes')

describe('Changes', () => {
  let changes
  let ownersFile
  let paths

  describe('owners property', () => {
    beforeEach(() => {
      ownersFile = {
        for: expect.createSpy().andReturn(['manny', 'moe', 'jack'])
      }

      paths = ['foo', 'bar', 'baz']

      changes = new Changes(paths, ownersFile)
    })

    it('returns the appropriate values', () => {
      const owners = changes.owners

      expect(owners).toInclude('manny')
      expect(owners).toInclude('moe')
      expect(owners).toInclude('jack')
      expect(owners.length).toEqual(3)
    })
  })
})
