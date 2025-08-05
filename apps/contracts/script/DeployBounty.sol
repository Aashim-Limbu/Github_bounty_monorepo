// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import {GitHubBountyDispenser} from "../src/Bounty.sol";

contract DeployBountyScript is Script {
    GitHubBountyDispenser bounty_dispenser;

    function run() external {
        bounty_dispenser = deploy();
    }

    function deploy() public returns (GitHubBountyDispenser bounty) {
        uint256 pk = vm.envUint("GITHUB_BOT_PRIVATE_KEY");
        address deployer = vm.addr(pk);
        vm.startBroadcast(pk);
        bounty = new GitHubBountyDispenser(deployer);
        vm.stopBroadcast();
    }
}
