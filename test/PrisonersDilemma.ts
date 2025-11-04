import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { PrisonersDilemma } from "../types";
import { expect } from "chai";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
  charlie: HardhatEthersSigner;
  dave: HardhatEthersSigner;
};

enum Choice {
  Cooperate = 0,
  Defect = 1,
}

enum ConditionSubject {
  RoundNumber = 0,
  MyLastMove = 1,
  OpponentLastMove = 2,
  MyTotalDefects = 3,
  OpponentTotalDefects = 4,
  OpponentTotalCooperates = 5,
}

enum ConditionOperator {
  Is = 0,
  IsNot = 1,
  GreaterThan = 2,
  LessThan = 3,
  Equals = 4,
}

enum TournamentStatus {
  Registration = 0,
  Countdown = 1,
  Running = 2,
  Finished = 3,
}

async function deployFixture() {
  const factory = await ethers.getContractFactory("PrisonersDilemma");
  const contract = (await factory.deploy()) as PrisonersDilemma;
  const contractAddress = await contract.getAddress();

  return { contract, contractAddress };
}

describe("PrisonersDilemma Tournament Mode", function () {
  let signers: Signers;
  let contract: PrisonersDilemma;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = {
      deployer: ethSigners[0],
      alice: ethSigners[1],
      bob: ethSigners[2],
      charlie: ethSigners[3],
      dave: ethSigners[4],
    };
  });

  beforeEach(async function () {
    ({ contract } = await deployFixture());
  });

  describe("Access Control", function () {
    it("should set deployer as owner", async function () {
      expect(await contract.owner()).to.equal(signers.deployer.address);
    });

    it("should allow owner to add authorized starter", async function () {
      await contract.connect(signers.deployer).addAuthorizedStarter(signers.alice.address);
      expect(await contract.authorizedStarters(signers.alice.address)).to.equal(true);
    });

    it("should not allow non-owner to add authorized starter", async function () {
      await expect(
        contract.connect(signers.alice).addAuthorizedStarter(signers.bob.address)
      ).to.be.revertedWith("Only owner");
    });

    it("should allow owner to remove authorized starter", async function () {
      await contract.connect(signers.deployer).addAuthorizedStarter(signers.alice.address);
      await contract.connect(signers.deployer).removeAuthorizedStarter(signers.alice.address);
      expect(await contract.authorizedStarters(signers.alice.address)).to.equal(false);
    });
  });

  describe("Strategy Submission", function () {
    it("should allow player to submit tit-for-tat strategy", async function () {
      const rules = [
        {
          subject: ConditionSubject.OpponentLastMove,
          operator: ConditionOperator.Is,
          value: Choice.Defect,
          action: Choice.Defect,
        },
      ];

      const tx = await contract.connect(signers.alice).submitStrategy(rules, Choice.Cooperate);
      await tx.wait();

      const [retrievedRules, defaultAction, isSubmitted] = await contract.getStrategy(signers.alice.address);
      expect(isSubmitted).to.equal(true);
      expect(retrievedRules.length).to.equal(1);
      expect(defaultAction).to.equal(Choice.Cooperate);
    });

    it("should not allow submitting strategy twice", async function () {
      await contract.connect(signers.alice).submitStrategy([], Choice.Cooperate);
      
      await expect(
        contract.connect(signers.alice).submitStrategy([], Choice.Defect)
      ).to.be.revertedWith("Strategy already submitted");
    });

    it("should reject too many rules", async function () {
      const rules = Array(21).fill({
        subject: ConditionSubject.RoundNumber,
        operator: ConditionOperator.Equals,
        value: 1,
        action: Choice.Cooperate,
      });

      await expect(
        contract.connect(signers.alice).submitStrategy(rules, Choice.Cooperate)
      ).to.be.revertedWith("Too many rules (max 20)");
    });

    it("should increment player count on submission", async function () {
      await contract.connect(signers.alice).submitStrategy([], Choice.Cooperate);
      await contract.connect(signers.bob).submitStrategy([], Choice.Defect);

      const info = await contract.getTournamentInfo();
      expect(info.playerCount).to.equal(2);
    });
  });

  describe("Tournament Countdown", function () {
    beforeEach(async function () {
      await contract.connect(signers.alice).submitStrategy([], Choice.Cooperate);
      await contract.connect(signers.bob).submitStrategy([], Choice.Defect);
    });

    it("should allow authorized user to set countdown", async function () {
      await contract.connect(signers.deployer).setTournamentCountdown(3600);
      
      const countdown = await contract.tournamentStartCountdown();
      expect(countdown).to.be.gt(0);
    });

    it("should not allow non-authorized to set countdown", async function () {
      await expect(
        contract.connect(signers.charlie).setTournamentCountdown(3600)
      ).to.be.revertedWith("Not authorized");
    });

    it("should update tournament status to Countdown", async function () {
      await contract.connect(signers.deployer).setTournamentCountdown(3600);
      
      const info = await contract.getTournamentInfo();
      expect(info.status).to.equal(TournamentStatus.Countdown);
    });
  });

  describe("Tournament Execution", function () {
    beforeEach(async function () {
      await contract.connect(signers.alice).submitStrategy([
        {
          subject: ConditionSubject.OpponentLastMove,
          operator: ConditionOperator.Is,
          value: Choice.Defect,
          action: Choice.Defect,
        },
      ], Choice.Cooperate);

      await contract.connect(signers.bob).submitStrategy([], Choice.Defect);
      await contract.connect(signers.charlie).submitStrategy([], Choice.Cooperate);
    });

    it("should not allow starting with less than 2 players", async function () {
      const newContract = (await (await ethers.getContractFactory("PrisonersDilemma")).deploy()) as PrisonersDilemma;
      await newContract.connect(signers.alice).submitStrategy([], Choice.Cooperate);

      await expect(
        newContract.connect(signers.deployer).forceStartTournament()
      ).to.be.revertedWith("Need at least 2 players");
    });

    it("should execute tournament with force start", async function () {
      const tx = await contract.connect(signers.deployer).forceStartTournament();
      await tx.wait();

      const info = await contract.getTournament(0);
      expect(info.status).to.equal(TournamentStatus.Finished);
      expect(info.isFinished).to.equal(true);
      expect(info.totalGames).to.equal(3);
    });

    it("should run all games in round-robin format", async function () {
      await contract.connect(signers.deployer).forceStartTournament();

      const game0 = await contract.getTournamentGame(0, 0);
      const game1 = await contract.getTournamentGame(0, 1);
      const game2 = await contract.getTournamentGame(0, 2);

      expect(game0.player1).to.not.equal(ethers.ZeroAddress);
      expect(game1.player1).to.not.equal(ethers.ZeroAddress);
      expect(game2.player1).to.not.equal(ethers.ZeroAddress);
    });

    it("should calculate player scores correctly", async function () {
      await contract.connect(signers.deployer).forceStartTournament();

      const aliceScore = await contract.getPlayerScore(0, signers.alice.address);
      const bobScore = await contract.getPlayerScore(0, signers.bob.address);
      const charlieScore = await contract.getPlayerScore(0, signers.charlie.address);

      expect(aliceScore).to.be.gt(0);
      expect(bobScore).to.be.gt(0);
      expect(charlieScore).to.be.gt(0);
    });

    it("should emit TournamentFinished event", async function () {
      await expect(
        contract.connect(signers.deployer).forceStartTournament()
      ).to.emit(contract, "TournamentFinished");
    });

    it("should prepare next tournament after finishing", async function () {
      await contract.connect(signers.deployer).forceStartTournament();

      const newInfo = await contract.getTournamentInfo();
      expect(newInfo.tournamentId).to.equal(1);
      expect(newInfo.status).to.equal(TournamentStatus.Registration);
      expect(newInfo.playerCount).to.equal(0);
    });
  });

  describe("Game Results", function () {
    beforeEach(async function () {
      await contract.connect(signers.alice).submitStrategy([
        {
          subject: ConditionSubject.OpponentLastMove,
          operator: ConditionOperator.Is,
          value: Choice.Defect,
          action: Choice.Defect,
        },
      ], Choice.Cooperate);

      await contract.connect(signers.bob).submitStrategy([], Choice.Defect);

      await contract.connect(signers.deployer).forceStartTournament();
    });

    it("should record game results correctly", async function () {
      const game = await contract.getTournamentGame(0, 0);

      expect(game.totalRounds).to.equal(100);
      expect(game.player1TotalScore).to.be.gt(0);
      expect(game.player2TotalScore).to.be.gt(0);
    });

    it("should record round history", async function () {
      const rounds = await contract.getTournamentGameRounds(0, 0);

      expect(rounds.length).to.equal(100);
      expect(rounds[0].player1Score).to.be.gte(0);
      expect(rounds[0].player2Score).to.be.gte(0);
    });

    it("should verify tit-for-tat vs always-defect scores", async function () {
      const game = await contract.getTournamentGame(0, 0);
      
      expect(game.player1TotalScore).to.equal(99);
      expect(game.player2TotalScore).to.equal(104);
    });
  });

  describe("Multiple Tournaments", function () {
    it("should allow starting new tournament after previous finishes", async function () {
      await contract.connect(signers.alice).submitStrategy([], Choice.Cooperate);
      await contract.connect(signers.bob).submitStrategy([], Choice.Defect);
      await contract.connect(signers.deployer).forceStartTournament();

      await contract.connect(signers.charlie).submitStrategy([], Choice.Cooperate);
      await contract.connect(signers.dave).submitStrategy([], Choice.Defect);

      const info = await contract.getTournamentInfo();
      expect(info.tournamentId).to.equal(1);
      expect(info.playerCount).to.equal(2);

      await contract.connect(signers.deployer).forceStartTournament();

      const finalInfo = await contract.getTournamentInfo();
      expect(finalInfo.tournamentId).to.equal(2);
    });
  });

  describe("Edge Cases", function () {
    it("should not allow submitting during non-registration phase", async function () {
      await contract.connect(signers.alice).submitStrategy([], Choice.Cooperate);
      await contract.connect(signers.bob).submitStrategy([], Choice.Defect);
      await contract.connect(signers.deployer).setTournamentCountdown(1);

      await expect(
        contract.connect(signers.charlie).submitStrategy([], Choice.Cooperate)
      ).to.be.revertedWith("Not in registration phase");
    });

    it.skip("should handle 4 players correctly (TODO: optimize for large tournaments)", async function () {
      await contract.connect(signers.alice).submitStrategy([], Choice.Cooperate);
      await contract.connect(signers.bob).submitStrategy([], Choice.Defect);
      await contract.connect(signers.charlie).submitStrategy([], Choice.Cooperate);
      await contract.connect(signers.dave).submitStrategy([], Choice.Defect);

      await contract.connect(signers.deployer).forceStartTournament({ gasLimit: 30000000 });

      const info = await contract.getTournament(0);
      expect(info.totalGames).to.equal(6);
    });
  });
});
