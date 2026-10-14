import { Link } from "react-router-dom"

export default function BookingUnavailablePage() {
    return (
        <main className="page-main">
            <section className="container">
                <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <h1 className="mb-4 text-2xl font-bold text-slate-800">
                        Chức năng đang phát triển
                    </h1>

                    <p className="mb-3 leading-7 text-slate-600">
                        Đặt vé, thanh toán và vé điện tử chưa được mở trong phiên bản này.
                    </p>

                    <p className="mb-6 text-sm text-slate-500">
                        Bạn có thể xem danh sách và thông tin phim hiện tại.
                    </p>

                    <Link to="/movies" className="button button-primary">
                        Xem danh sách phim
                    </Link>
                </div>
            </section>
        </main>
    )
}