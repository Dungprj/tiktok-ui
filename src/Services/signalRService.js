import * as signalR from '@microsoft/signalr';

const createSignalRConnection = (
    //nhận hàm để lấy connectionId
    onReceiveConnectionId,
    //nhận hàm để lấy danh sách người dùng đã kết nối
    onUserListUpdate,
    //nhận hàm để lấy danh sách cuộc họp
    onMeetingListUpdate,
    //nhận hàm để lấy danh sách người tham gia cuộc họp
    onMeetingParticipantsUpdate
) => {
    const connection = new signalR.HubConnectionBuilder()
        .withUrl(`${process.env.REACT_APP_BASE_URL_HUB}`, {
            withCredentials: false
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000])
        .configureLogging(signalR.LogLevel.Information)
        .build();

    const startConnection = async () => {
        if (connection.state === signalR.HubConnectionState.Disconnected) {
            try {
                await connection.start();
                console.log('✅ SignalR Connected');
            } catch (err) {
                console.error('❌ SignalR Connection Error:', err);
                setTimeout(startConnection, 5000);
            }
        }
    };

    startConnection();

    connection.onclose(async () => {
        console.warn('🔄 Kết nối SignalR bị mất. Đang thử kết nối lại...');
        await startConnection();
    });

    connection.on('ReceiveConnectionId', connectionId => {
        console.log(`🔗 Nhận Connection ID: ${connectionId}`);
        onReceiveConnectionId(connectionId);
    });

    connection.on('UpdateUserList', userList => {
        console.log(`📌 Danh sách người đã kết nối:`, userList);
        onUserListUpdate(userList);
    });

    connection.on('UpdateMeetingList', meetingList => {
        console.log(`📅 Danh sách cuộc họp:`, meetingList);
        onMeetingListUpdate(meetingList);
    });

    connection.on('UpdateMeetingParticipants', (meetingId, participants) => {
        console.log(
            `👥 Danh sách người trong cuộc họp ${meetingId}:`,
            participants
        );
        onMeetingParticipantsUpdate(meetingId, participants);
    });

    return connection;
};

export default createSignalRConnection;
