import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export async function getConversations(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const userConversations = await prisma.userConversation.findMany({
    where: { userId },
    include: {
      conversation: {
        include: {
          users: {
            include: {
              user: {
                select: { id: true, name: true, avatarUrl: true },
              },
            },
          },
        },
      },
    },
    orderBy: { conversation: { updatedAt: 'desc' } },
    skip,
    take: limit,
  });

  const total = await prisma.userConversation.count({ where: { userId } });

  const conversations = await Promise.all(
    userConversations.map(async (uc) => {
      const conv = uc.conversation;
      const other = conv.users.find((cu: { userId: string }) => cu.userId !== userId);

      const unreadCount = await prisma.message.count({
        where: {
          conversationId: conv.id,
          receiverId: userId,
          isRead: false,
        },
      });

      let lastMessage = null;
      if (conv.lastMessageId) {
        lastMessage = await prisma.message.findUnique({
          where: { id: conv.lastMessageId },
          select: { content: true, senderId: true, createdAt: true },
        });
      }

      return {
        id: conv.id,
        otherUser: other?.user ?? null,
        lastMessage,
        unreadCount,
        updatedAt: conv.updatedAt,
      };
    })
  );

  return { conversations, total, page, limit };
}

export async function getOrCreateConversation(userId: string, otherUserId: string) {
  if (userId === otherUserId) {
    throw new AppError('Cannot create conversation with yourself', 400);
  }

  const otherUser = await prisma.user.findUnique({ where: { id: otherUserId } });
  if (!otherUser) {
    throw new AppError('User not found', 404);
  }

  const existing = await prisma.userConversation.findFirst({
    where: {
      userId,
      conversation: {
        users: { some: { userId: otherUserId } },
      },
    },
    include: {
      conversation: {
        include: {
          users: {
            include: {
              user: {
                select: { id: true, name: true, avatarUrl: true },
              },
            },
          },
        },
      },
    },
  });

  if (existing) {
    const other = existing.conversation.users.find(
      (cu: { userId: string }) => cu.userId !== userId
    );
    return {
      id: existing.conversation.id,
      otherUser: other?.user ?? null,
      updatedAt: existing.conversation.updatedAt,
    };
  }

  const conversation = await prisma.conversation.create({
    data: {
      users: {
        create: [{ userId }, { userId: otherUserId }],
      },
    },
    include: {
      users: {
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      },
    },
  });

  const other = conversation.users.find(
    (cu: { userId: string }) => cu.userId !== userId
  );
  return {
    id: conversation.id,
    otherUser: other?.user ?? null,
    updatedAt: conversation.updatedAt,
  };
}

export async function getMessages(
  userId: string,
  conversationId: string,
  page = 1,
  limit = 50
) {
  const participation = await prisma.userConversation.findUnique({
    where: {
      userId_conversationId: { userId, conversationId },
    },
  });

  if (!participation) {
    throw new AppError('Conversation not found', 404);
  }

  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.message.count({ where: { conversationId } }),
  ]);

  return { messages: messages.reverse(), total, page, limit };
}

export async function sendMessage(
  senderId: string,
  receiverId: string,
  content: string
) {
  if (senderId === receiverId) {
    throw new AppError('Cannot send message to yourself', 400);
  }

  const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
  if (!receiver) {
    throw new AppError('Receiver not found', 404);
  }

  const existing = await prisma.userConversation.findFirst({
    where: {
      userId: senderId,
      conversation: {
        users: { some: { userId: receiverId } },
      },
    },
  });

  let conversationId: string;

  if (existing) {
    conversationId = existing.conversationId;
  } else {
    const conversation = await prisma.conversation.create({
      data: {
        users: {
          create: [{ userId: senderId }, { userId: receiverId }],
        },
      },
    });
    conversationId = conversation.id;
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId,
      receiverId,
      content,
    },
    include: {
      sender: {
        select: { id: true, name: true, avatarUrl: true },
      },
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageId: message.id, updatedAt: new Date() },
  });

  return message;
}

export async function markAsRead(userId: string, conversationId: string) {
  await prisma.message.updateMany({
    where: {
      conversationId,
      receiverId: userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  await prisma.userConversation.update({
    where: {
      userId_conversationId: { userId, conversationId },
    },
    data: {
      lastReadAt: new Date(),
    },
  });
}

export async function getUnreadCount(userId: string) {
  const count = await prisma.message.count({
    where: {
      receiverId: userId,
      isRead: false,
    },
  });

  return { unreadCount: count };
}

export async function searchUsers(userId: string, query: string, limit = 20) {
  const users = await prisma.user.findMany({
    where: {
      id: { not: userId },
      status: 'ACTIVE',
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      email: true,
    },
    take: limit,
  });

  return users;
}
