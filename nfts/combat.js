/**
 * This is a variation of the example created here by
 * Joshua Henslee https://www.youtube.com/watch?v=KIz94YnVJug&t=857s.
 * 
 * The idea is create a few NFTs. In this case we are creating
 * jigs that represents weapons in a video game. Each weapon is unique
 * and can be identified and treated differently. But weapons
 * of the same class have similar behavior.
 * 
 * In this case
 */

const Run = require('run-sdk')

const { expect } = Run.extra

/** Weapon
 * Base class for our nfts. A weapon is something that can be send
 * and that can only be created in certain ways.
 */
class Weapon extends Run.Jig {
  init (id, owner) {
    // Weapons can only be createdi using the static method "forge" on their class
    if (caller !== this.constructor) throw new Error('Can only be created via forge() method')
    // Each weapon has an id
    this.id = id
    // Each weapon is assigned to a certain owner when created.
    this.owner = owner
  }

  // Abstract method
  attackPower () {
    throw new Error('should be implemented by subclass')
  }

  send (to) {
    this.owner = to
  }
}

Weapon.deps = {
  expect
}

/**
 * Subclass of weapon. The strenghth of a sword
 * depends of their id.
 */
class Sword extends Weapon {
  attackPower () {
    return this.id // Each sword has a different attack power
  }


  /**
   * Only the owner of the Sword class can create
   * swords. But when they are created they can be send to other
   * users.
   */
  static forge (swordOwner) {
    this.forgeCount = this.forgeCount + 1
    if (this.forgeCount > this.maxAmount) {
      throw new Error('No more swords for forge')
    }
    return new Sword(
      this.forgeCount, // Each sword is better than the previous one
      swordOwner
    )
  }
}

Sword.maxAmount = 20
Sword.forgeCount = 0

class Knife extends Weapon {
  attackPower () {
    return 4 // Every knife has the same attack power
  }

  /**
   * Same strategy than Sword
   */
  static forge (knifeOwner) {
    if (this.forgeCount > this.maxAmount) {
      throw new Error(`No more ${this.name} for forge`)
    }
    this.forgeCount = this.forgeCount + 1
    return new this(
      this.forgeCount,
      knifeOwner
    )
  }
}

Knife.maxAmount = 10
Knife.forgeCount = 0

class Staff extends Weapon {
  attackPower () {
    // Each stuff has different power depending on its location.
    const txid = this.location.split('_')[0]
    const last2Digits = txid.slice(-2)
    const [digit1, digit2] = last2Digits.split('')
    return parseInt(digit1, 16) + parseInt(digit2, 16)
  }

  /**
   * Same strategy than Sword
   */
  static forge (staffOwner) {
    if (this.forgeCount > this.maxAmount) {
      throw new Error(`No more ${this.name} for forge`)
    }
    this.forgeCount = this.forgeCount + 1
    return new this(
      this.forgeCount,
      staffOwner
    )
  }
}

Staff.maxAmount = 3
Staff.forgeCount = 0


/**
 * Characters are also unique and can be equiped with weapons.
 */
class Character extends Run.Jig {
  init (name, owner) {
    this.naturalPower = 0
    this.name = name
    this.owner = owner
    this.equipment = []
    this.maxHp = 100
  }

  send (to) {
    this.owner = to
  }

  attackPower () {
    return this.naturalPower +
      this.equipment.reduce((total, weapon) => total + weapon.id, 0)
  }

  equip (weapon) {
    expect(weapon).toBeInstanceOf(Weapon)
    expect(weapon.owner).toEqual(this.owner)
    this.equipment = [weapon]

    if (this.equipment.length > 3) {
      throw new Error('too much equipment')
    }
  }

  levelUp () {
    this.naturalPower = this.naturalPower + 1
    this.maxHp = this.maxHp + 10
  }
}

Character.deps = {
  expect,
  Weapon
}

const main = async () => {
  // Initializing run:
  const run = new Run({ network: 'mock' })

  /** Deploy classes
   * 
   * Deploy code is synchronous. The deploy method returns the wropped
   * class, ready to be use in your app.
   */
  console.log('deploying clases')
  Sword = run.deploy(Sword)
  Knife = run.deploy(Knife)
  Staff = run.deploy(Staff)
  Character =  run.deploy(Character)

  /** Create weapons */

  console.log(`Before creating any weapon both weapon clases
had their forgeCount set to 0:

Sword.forgeCount: ${Sword.forgeCount}
Knife.forgeCount: ${Knife.forgeCount}
  `)

  // create a few weapons
  console.log('Creating sword 1...')
  const sword1 = Sword.forge(await run.owner.nextOwner())
  console.log('Creating sword 2...')
  const sword2 = Sword.forge(await run.owner.nextOwner())
  console.log('Creating sword 3...')
  const sword3 = Sword.forge(await run.owner.nextOwner())
  console.log('Creating sword 4...')
  const sword4 = Sword.forge(await run.owner.nextOwner())
  console.log('Creating knife 1...')
  const knife1 = Knife.forge(await run.owner.nextOwner())
  console.log('Creating staff 1...')
  const staff1 = Staff.forge(await run.owner.nextOwner())

  console.log(`
  
After creating some weapons the counters increase:

Sword.forgeCount: ${Sword.forgeCount}
Knife.forgeCount: ${Knife.forgeCount}
  `)



  // create 2 characters
  console.log('creating chraracters...')
  const aCharacter = new Character('finn', await run.owner.nextOwner())
  const anotherCharacter = new Character('jake', await run.owner.nextOwner())

  
  // equip weapons
  console.log('equiping weapons...')
  aCharacter.equip(sword1)
  aCharacter.equip(sword3)
  aCharacter.equip(knife1)
  anotherCharacter.equip(sword2)
  anotherCharacter.equip(sword4)
  anotherCharacter.equip(staff1)


  /** Creating every sword other sword
   * 
   *  Because swords can only be forged there can only be a certain amount.
   *  Let's create every sword left and then try to create another one
   */

  await run.sync()  
  await Promise.all(new Array(Sword.maxAmount - Sword.forgeCount).fill(1).map(async () => {
    const sword = Sword.forge(await run.owner.nextOwner())
    console.log('creating sword number', sword.id)
    await run.sync()
  }))

  // Attempting to create extra sword.
  try {
    console.log('trying to create swornd number 21')
    Sword.forge(await run.owner.nextOwner())
  } catch (e) {
    console.log('Create sword number 21 failed with error:')
    console.log(e)
  }
}

main()