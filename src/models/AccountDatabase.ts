/// Account database model
import { FriendInfo } from '../interfaces/returns/friend/FriendInfo';
import { StrangerInfo } from '../interfaces/returns/friend/StrangerInfo';
import { UnidirectionalFriendInfo } from '../interfaces/returns/friend/UnidirectionalFriendInfo';
import { GroupInfo } from '../interfaces/returns/group/GroupInfo';
import { GroupMemberInfo } from '../interfaces/returns/group/GroupMemberInfo';
import { API } from './API';
import { Logger } from './Logger';

/* Export class */
export class AccountDatabase {
  /* Properties */
  private logger: Logger = new Logger('账号数据库');
  private api: API = new API('$accountDatabase');

  private friendMap: Map<bigint, string> = new Map();
  private groupMap: Map<bigint, string> = new Map();

  /* Methods */
  public async fetchAll(): Promise<void> {
    this.logger.info('正在拉取所有账号信息');

    try {
      // Fetch friend list
      const friends: FriendInfo[] = await this.api.getFriendList();
      friends.forEach((value: FriendInfo): void => {
        this.friendMap.set(value.user_id, value.nickname);
      });

      // Fetch unidirectional friend list
      const uniFriends: UnidirectionalFriendInfo[] =
        await this.api.getUnidirectionalFirendList();
      uniFriends.forEach((value: UnidirectionalFriendInfo): void => {
        this.friendMap.set(value.user_id, value.nickname);
      });

      // Fetch group list
      const groups: GroupInfo[] = await this.api.getGroupList();
      groups.forEach((value: GroupInfo): void => {
        this.groupMap.set(value.group_id, value.group_name);
      });
    } catch (err: unknown) {
      this.logger.error('账号信息拉取失败', err);
    }
  }
  public async getUserNickname(
    userId: bigint,
    groupId?: bigint
  ): Promise<string> {
    // If cache matched
    if (this.friendMap.has(userId)) {
      return this.friendMap.get(userId) as string;
    }

    this.logger.warn(`正在拉取用户信息: ${userId}`);

    try {
      if (groupId === undefined) {
        throw 0;
      }

      // Get group member info
      const groupMemberInfo: GroupMemberInfo = await this.api.getGroupMemberInfo(groupId, userId);

      // Update cache
      this.friendMap.set(userId, groupMemberInfo.nickname);

      return groupMemberInfo.nickname;
    } catch (err: unknown) {}

    try {
      // Get stranger info
      const userInfo: StrangerInfo = await this.api.getStrangerInfo(userId);

      // Update cache
      this.friendMap.set(userId, userInfo.nickname);

      return userInfo.nickname;
    } catch (err: unknown) {
      this.logger.warn(`无法获取用户信息: ${userId}`, err);
      return '';
    }
  }
  public async getGroupName(groupId: bigint): Promise<string> {
    // If cache matched
    if (this.groupMap.has(groupId)) {
      return this.groupMap.get(groupId) as string;
    }

    this.logger.warn(`正在拉取群信息: ${groupId}`);
    try {
      // Get group info
      const groupInfo: GroupInfo = await this.api.getGroupInfo(groupId);

      // Update cache
      this.groupMap.set(groupId, groupInfo.group_name);

      return groupInfo.group_name;
    } catch (err: unknown) {
      this.logger.warn(`无法获取群信息: ${groupId}`, err);
      return '';
    }
  }

  /* Singleton */
  private static instance?: AccountDatabase;
  private constructor() {
    const func = async (): Promise<void> => {
      await this.fetchAll();
      setTimeout(func, 3600000);
    };
    setTimeout(func, 0);
  }
  public static getInstance(): AccountDatabase {
    if (AccountDatabase.instance === undefined) {
      AccountDatabase.instance = new AccountDatabase();
    }
    return AccountDatabase.instance;
  }
}
