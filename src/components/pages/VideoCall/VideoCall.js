import React, { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';
import createSignalRConnection from '../../../Services/signalRService';
import classNames from 'classnames/bind';
import styles from './VideoCall.module.scss';
import * as signalR from '@microsoft/signalr';

const cx = classNames.bind(styles);

const VideoCall = () => {
    const [peerId, setPeerId] = useState('');
    const [remotePeers, setRemotePeers] = useState([]); // Danh sách người đã kết nối
    const [callParticipants, setCallParticipants] = useState([]); // Danh sách người trong cuộc gọi
    const [meetingId, setMeetingId] = useState(''); // ID cuộc họp
    const [meetings, setMeetings] = useState([]); // Danh sách các cuộc họp
    const peerRef = useRef(null);
    const signalRRef = useRef(null);
    const localStreamRef = useRef(null);
    const videoRefs = useRef([]);

    useEffect(() => {
        let peer = null;

        const handleReceiveConnectionId = async connectionId => {
            console.log(
                `🔗 Nhận SignalR ID, sử dụng làm Peer ID: ${connectionId}`
            );
            setPeerId(connectionId);

            peer = new Peer(connectionId);
            peerRef.current = peer;

            peer.on('open', async id => {
                console.log(`✅ PeerJS đã khởi tạo với ID: ${id}`);
            });

            peer.on('call', call => {
                call.answer(localStreamRef.current);
                call.on('stream', remoteStream => {
                    addVideo(call.peer, remoteStream);
                });
            });

            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
                localStreamRef.current = stream;
                addVideo('you', stream, true);
            } catch (error) {
                console.error('❌ Không thể truy cập camera/mic:', error);
            }
        };

        const handleUpdateUserList = userList => {
            console.log(
                '📌 Danh sách toàn bộ thành viên đã kết nối:',
                userList
            );
            setRemotePeers(userList);
        };

        const handleUpdateMeetingList = meetingList => {
            console.log('📅 Danh sách cuộc họp:', meetingList);
            setMeetings(meetingList);
        };

        const handleUpdateMeetingParticipants = (meetingId, participants) => {
            console.log(
                `📞 Danh sách người trong cuộc họp ${meetingId}:`,
                participants
            );
            setCallParticipants(participants);

            // Khi danh sách cập nhật, gọi video đến tất cả thành viên mới
            participants.forEach(participant => {
                if (
                    participant !== peerId &&
                    !videoRefs.current.some(video => video.id === participant)
                ) {
                    makeCall(peerRef.current, participant);
                }
            });
        };

        signalRRef.current = createSignalRConnection(
            handleReceiveConnectionId,
            handleUpdateUserList,
            handleUpdateMeetingList,
            handleUpdateMeetingParticipants
        );

        return () => {
            if (peerRef.current) peerRef.current.destroy();
            if (signalRRef.current) signalRRef.current.stop();
        };
    }, []);

    // Tạo cuộc họp mới
    const createMeeting = () => {
        if (meetingId.trim() === '') {
            console.warn('⚠️ Vui lòng nhập ID cuộc họp.');
            return;
        }

        signalRRef.current
            .invoke('CreateMeeting', meetingId)
            .then(() => console.log(`📅 Đã tạo cuộc họp ${meetingId}`))
            .catch(err => console.error('⚠️ Không thể tạo cuộc họp:', err));
    };

    // Tham gia cuộc họp với ID cụ thể
    const joinMeeting = () => {
        if (meetingId.trim() === '') {
            console.warn('⚠️ Vui lòng nhập ID cuộc họp.');
            return;
        }

        signalRRef.current
            .invoke('JoinMeeting', meetingId)
            .then(() => console.log(`✅ Đã tham gia cuộc họp ${meetingId}`))
            .catch(err =>
                console.error('⚠️ Không thể tham gia cuộc họp:', err)
            );
    };

    // Rời cuộc họp hiện tại (Sửa lỗi)
    const leaveMeeting = () => {
        if (meetingId.trim() === '') {
            console.warn('⚠️ Vui lòng nhập ID cuộc họp để rời.');
            return;
        }

        signalRRef.current
            .invoke('LeaveMeeting', meetingId)
            .then(() => {
                console.log(`🚪 Đã rời khỏi cuộc họp ${meetingId}`);

                // Ngắt kết nối PeerJS khi rời cuộc gọi
                if (peerRef.current) {
                    peerRef.current.destroy();
                    peerRef.current = null;
                }

                // Xóa video của người dùng
                removeVideo(peerId);

                // Cập nhật danh sách người gọi
                setCallParticipants(prev => prev.filter(pid => pid !== peerId));

                // Tắt mic & camera
                if (localStreamRef.current) {
                    localStreamRef.current
                        .getTracks()
                        .forEach(track => track.stop());
                    localStreamRef.current = null;
                }
            })
            .catch(err => console.error('⚠️ Không thể rời cuộc họp:', err));
    };

    // Gọi đến một Peer trong phòng họp
    const makeCall = (peer, targetPeerId) => {
        if (
            !peer ||
            !localStreamRef.current ||
            videoRefs.current.some(video => video.id === targetPeerId)
        )
            return;

        console.log(`📞 Gọi đến: ${targetPeerId}`);

        const call = peer.call(targetPeerId, localStreamRef.current);
        call.on('stream', remoteStream => {
            addVideo(targetPeerId, remoteStream);
        });
    };

    // Thêm video vào giao diện
    const addVideo = (peerId, stream, isLocal = false) => {
        if (videoRefs.current.some(video => video.id === peerId)) return;

        const video = document.createElement('video');
        video.srcObject = stream;
        video.autoplay = true;
        video.muted = isLocal;
        video.style.width = '200px';
        video.style.margin = '5px';
        video.id = peerId;

        document.getElementById('videoContainer').appendChild(video);
        videoRefs.current.push(video);
    };
    // Xóa video khỏi giao diện khi rời cuộc họp
    const removeVideo = peerId => {
        const videoIndex = videoRefs.current.findIndex(
            video => video.id === peerId
        );

        if (videoIndex !== -1) {
            const video = videoRefs.current[videoIndex];

            video.pause();
            video.srcObject = null;
            video.remove();

            videoRefs.current.splice(videoIndex, 1);
        }
    };

    return (
        <div className={cx('container')}>
            <h2>Group Video Call</h2>
            <p>
                Your Peer ID: <strong>{peerId}</strong>
            </p>

            {/* Ô nhập ID để tạo/join cuộc họp */}
            <div>
                <input
                    type='text'
                    placeholder='Nhập ID cuộc họp'
                    value={meetingId}
                    onChange={e => setMeetingId(e.target.value)}
                />
                <button onClick={createMeeting}>Tạo cuộc họp</button>
                <button onClick={joinMeeting}>Tham gia cuộc họp</button>
                <button onClick={leaveMeeting}>Rời cuộc họp</button>
            </div>

            {/* Danh sách cuộc họp */}
            <div>
                <h3>Danh sách cuộc họp:</h3>
                <ul>
                    {meetings.map((meet, index) => (
                        <li key={index}>{meet}</li>
                    ))}
                </ul>
            </div>

            {/* Danh sách người đang trong cuộc họp */}
            <div>
                <h3>Thành viên trong cuộc họp:</h3>
                <ul>
                    {callParticipants.map((pid, index) => (
                        <li key={index}>{pid}</li>
                    ))}
                </ul>
            </div>

            {/* Khu vực hiển thị video */}
            <div id='videoContainer'></div>
        </div>
    );
};

export default VideoCall;
